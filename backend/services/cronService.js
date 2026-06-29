import cron from 'node-cron';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import Notification from '../models/Notification.js';
import CalendarEvent from '../models/CalendarEvent.js';
import { generateNotificationMessage } from './geminiService.js';
import { createNotification } from './notificationService.js';
import { io } from '../socket/socketHandler.js';
import { checkAlertTriggers } from './alertService.js';
import { sendPushToUser } from './pushService.js';
import { setPendingProactiveCommand } from './voiceIntentService.js';
import { sendEmailReminder } from './emailService.js';
import Plan from '../models/Plan.js';
import { sendPlanReminder } from './planService.js';

export const startCronJobs = () => {
  // Runs every 10 minutes for proactive alerts
  cron.schedule('*/10 * * * *', async () => {
    try {
      await checkAlertTriggers();
    } catch (error) {
      console.error('[Cron] Error running proactive alerts check:', error);
    }
  });

  // Runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const users = await User.find({}).lean();
      const now = new Date();

      await Promise.all(users.map(async (user) => {
        const userId = user._id;
        const roomName = `user_${userId}`;
        const sendEmail = user.email && user.notificationPreferences?.email !== false;

        // 1. Check tasks with dueDate within next 2 hours
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const imminentTasks = await Task.find({
          userId,
          completed: false,
          dueDate: { $gte: now, $lte: twoHoursFromNow }
        }).lean();

        for (const task of imminentTasks) {
          const existing = await Notification.findOne({
            userId,
            type: 'deadline_warning',
            title: { $regex: task.title, $options: 'i' },
            createdAt: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }
          });

          if (!existing) {
            const message = await generateNotificationMessage('deadline_warning', { title: task.title });
            const notification = await createNotification(
              userId,
              `Deadline Warning: ${task.title}`,
              message,
              'deadline_warning'
            );
            if (notification && io) {
              io.to(roomName).emit('notification:new', notification);
            }
            await sendPushToUser(userId, `⏰ Deadline in 2h: ${task.title}`, message, { tag: `deadline-${task._id}`, url: '/dashboard?tab=tasks' });
            if (sendEmail) {
              await sendEmailReminder(user.email, `Deadline Warning: ${task.title}`, message);
            }
          }
        }

        // 2. Check habits not completed for their target day by 8PM (hour >= 20)
        const currentHour = now.getHours();
        const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

        if (currentHour >= 20) {
          const habits = await Habit.find({
            userId,
            targetDays: todayName
          }).lean();

          for (const habit of habits) {
            const todayDateStr = now.toDateString();
            const completedToday = habit.completions?.some(c => {
              return new Date(c.date).toDateString() === todayDateStr && c.completed;
            });

            if (!completedToday) {
              const todayStart = new Date(now);
              todayStart.setHours(0, 0, 0, 0);
              const existing = await Notification.findOne({
                userId,
                type: 'habit_miss',
                title: { $regex: habit.name, $options: 'i' },
                createdAt: { $gte: todayStart }
              });

              if (!existing) {
                const message = await generateNotificationMessage('habit_miss', { title: habit.name });
                const notification = await createNotification(
                  userId,
                  `Habit Missed: ${habit.name}`,
                  message,
                  'habit_miss'
                );
                if (notification && io) {
                  io.to(roomName).emit('notification:new', notification);
                }
                if (sendEmail) {
                  await sendEmailReminder(user.email, `Habit Missed: ${habit.name}`, message);
                }
              }
            }
          }
        }

        // 3. Check goals with progress < 20% and targetDate within 7 days
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const behindGoals = await Goal.find({
          userId,
          progress: { $lt: 20 },
          targetDate: { $gte: now, $lte: sevenDaysFromNow }
        }).lean();

        for (const goal of behindGoals) {
          const existing = await Notification.findOne({
            userId,
            type: 'goal_behind',
            title: { $regex: goal.title, $options: 'i' },
            createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
          });

          if (!existing) {
            const message = await generateNotificationMessage('goal_behind', { title: goal.title });
            const notification = await createNotification(
              userId,
              `Goal Pace Alert: ${goal.title}`,
              message,
              'goal_behind'
            );
            if (notification && io) {
              io.to(roomName).emit('notification:new', notification);
            }
            if (sendEmail) {
              await sendEmailReminder(user.email, `Goal Pace Alert: ${goal.title}`, message);
            }
          }
        }

        // 4. Check upcoming meetings for high-frequency interval alerts
        const upcomingEvents = await CalendarEvent.find({
          userId,
          startTime: { $gte: new Date(now.getTime() - 30 * 60 * 1000), $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000) },
          notificationsEnabled: { $ne: false }
        });

        for (const event of upcomingEvents) {
          const timeDiffMs = event.startTime.getTime() - now.getTime();
          const hoursRemaining = timeDiffMs / (1000 * 60 * 60);

          let intervalKey = null;
          let timeLabel = '';

          if (hoursRemaining >= 23.9 && hoursRemaining <= 24.1) {
            intervalKey = '24h'; timeLabel = 'in 24 hours (tomorrow)';
          } else if (hoursRemaining >= 7.9 && hoursRemaining <= 8.1) {
            intervalKey = '8h'; timeLabel = 'in 8 hours';
          } else if (hoursRemaining >= 0.9 && hoursRemaining <= 1.1) {
            intervalKey = '1h'; timeLabel = 'in 1 hour';
          } else if (hoursRemaining >= 0.1 && hoursRemaining <= 0.25) {
            intervalKey = '10m'; timeLabel = 'in 10 minutes';
          } else if (hoursRemaining >= -0.05 && hoursRemaining <= 0.05) {
            intervalKey = '0h'; timeLabel = 'right now';
          }

          if (intervalKey && !event.notifiedIntervals?.includes(intervalKey)) {
            const formattedTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const message = intervalKey === '0h'
              ? `Reminder: "${event.title}" is starting right now at ${formattedTime}.`
              : `Reminder: "${event.title}" is scheduled ${timeLabel} at ${formattedTime}.`;

            const notification = await createNotification(userId, `Upcoming Event: ${event.title}`, message, 'event_reminder');
            if (!event.notifiedIntervals) event.notifiedIntervals = [];
            event.notifiedIntervals.push(intervalKey);
            await event.save();

            if (notification && io) {
              io.to(roomName).emit('notification:new', notification);
            }
            if (sendEmail) {
              await sendEmailReminder(user.email, `Event Reminder: ${event.title}`, message);
            }
          }
        }
      }));
    } catch (error) {
      console.error('[Cron] Error in scheduled cron jobs:', error);
    }
  });

  // ── Plan Daily Reminder ───────────────────────────────────────────
  // Runs every minute — finds active plans whose reminderTime == now
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const plans = await Plan.find({
        status: 'active',
        reminderTime: currentTime
      });

      for (const plan of plans) {
        try {
          await sendPlanReminder(plan);
        } catch (reminderErr) {
          console.error(`[Cron] Plan reminder failed for plan ${plan._id}:`, reminderErr.message);
        }
      }
    } catch (error) {
      console.error('[Cron] Error in plan reminder cron:', error);
    }
  });

  console.log('[Cron] Scheduled tasks service initialized successfully.');
};

