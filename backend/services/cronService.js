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

export const startCronJobs = () => {
  // Runs every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Running scheduled audits for user alerts...');
    try {
      const users = await User.find({});
      const now = new Date();

      for (const user of users) {
        const userId = user._id;
        const roomName = `user_${userId}`;

        // 1. Check tasks with dueDate within next 2 hours
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const imminentTasks = await Task.find({
          userId,
          completed: false,
          dueDate: { $gte: now, $lte: twoHoursFromNow }
        });

        for (const task of imminentTasks) {
          // Check if already notified in the last 2 hours to avoid spamming
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
              console.log(`[Cron] Emitting deadline_warning to ${roomName} for task "${task.title}"`);
              io.to(roomName).emit('notification:new', notification);
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
          });

          for (const habit of habits) {
            const todayDateStr = now.toDateString();
            const completedToday = habit.completions?.some(c => {
              return new Date(c.date).toDateString() === todayDateStr && c.completed;
            });

            if (!completedToday) {
              // Check if already notified today (since 12 AM today)
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
                  console.log(`[Cron] Emitting habit_miss to ${roomName} for habit "${habit.name}"`);
                  io.to(roomName).emit('notification:new', notification);
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
        });

        for (const goal of behindGoals) {
          // Check if already notified in the last 7 days
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
              console.log(`[Cron] Emitting goal_behind to ${roomName} for goal "${goal.title}"`);
              io.to(roomName).emit('notification:new', notification);
            }
          }
        }

        // 4. Check upcoming meetings or exams for high-frequency alerts
        const upcomingEvents = await CalendarEvent.find({
          userId,
          startTime: { $gte: now, $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000) },
          notificationsEnabled: { $ne: false }
        });

        for (const event of upcomingEvents) {
          const isMeetingOrExam = event.type === 'meeting' || 
            /meeting|exam|test|quiz/i.test(event.title) || 
            /meeting|exam|test|quiz/i.test(event.notes);
            
          if (!isMeetingOrExam) continue;

          const timeDiffMs = event.startTime.getTime() - now.getTime();
          const hoursRemaining = timeDiffMs / (1000 * 60 * 60);

          let intervalKey = null;
          let timeLabel = '';

          if (hoursRemaining >= 23.5 && hoursRemaining <= 24.5) {
            intervalKey = '24h';
            timeLabel = 'in 24 hours (tomorrow)';
          } else if (hoursRemaining >= 4.5 && hoursRemaining <= 5.3) {
            intervalKey = '5h';
            timeLabel = 'in 5 hours';
          } else if (hoursRemaining >= 2.5 && hoursRemaining <= 3.3) {
            intervalKey = '3h';
            timeLabel = 'in 3 hours';
          } else if (hoursRemaining >= 1.5 && hoursRemaining <= 2.3) {
            intervalKey = '2h';
            timeLabel = 'in 2 hours';
          } else if (hoursRemaining >= 0.0 && hoursRemaining <= 1.3) {
            intervalKey = '1h';
            timeLabel = 'in 1 hour';
          }

          if (intervalKey && !event.notifiedIntervals?.includes(intervalKey)) {
            const formattedTime = new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const message = `Reminder: "${event.title}" is scheduled ${timeLabel} at ${formattedTime}.`;
            
            const notification = await createNotification(
              userId,
              `Upcoming Event: ${event.title}`,
              message,
              'event_reminder'
            );
            
            if (!event.notifiedIntervals) {
              event.notifiedIntervals = [];
            }
            event.notifiedIntervals.push(intervalKey);
            await event.save();

            if (notification && io) {
              console.log(`[Cron] Emitting event_reminder (${intervalKey}) to ${roomName} for event "${event.title}"`);
              io.to(roomName).emit('notification:new', notification);
            }
          }
        }
      }
    } catch (error) {
      console.error('[Cron] Error in scheduled cron jobs:', error);
    }
  });

  console.log('[Cron] Scheduled tasks service initialized successfully (30m intervals).');
};
