import User from '../models/User.js';
import Task from '../models/Task.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Habit from '../models/Habit.js';
import Notification from '../models/Notification.js';
import { generateDailySummary } from './geminiService.js';
import { io } from '../socket/socketHandler.js';
import { sendPushToUser } from './pushService.js';

/**
 * Helper to fetch daily task/event info and ask Gemini to build a spoken morning briefing
 */
export async function generateBriefingSummary(userId) {
  const user = await User.findById(userId);
  if (!user) return 'Welcome back to ResQ.';

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    userId,
    $or: [
      { dueDate: { $gte: todayStart, $lte: todayEnd } },
      { completed: false }
    ]
  });

  const events = await CalendarEvent.find({
    userId,
    startTime: { $gte: todayStart, $lte: todayEnd }
  });

  const habits = await Habit.find({ userId });

  try {
    const summary = await generateDailySummary(user, tasks, events, habits);
    return summary;
  } catch (err) {
    console.error('[Briefing] Gemini briefing generation failed. Using backup brief.', err.message);
    const pendingCount = tasks.filter(t => !t.completed).length;
    const eventCount = events.length;
    return `Good morning, ${user.name.split(' ')[0]}. You have ${pendingCount} pending tasks and ${eventCount} events on your schedule today. Let's make it a productive day!`;
  }
}

/**
 * Checks if morning briefing needs to be sent for user (runs once per day after 6 AM)
 */
export async function checkMorningBriefing(socket, userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const todayStr = new Date().toDateString();
    const currentHour = new Date().getHours();

    if (user.lastBriefingDate !== todayStr && currentHour >= 6) {
      console.log(`[AlertService] Generating morning briefing for user ${userId}`);
      const briefing = await generateBriefingSummary(userId);

      socket.emit('resq:proactive_alert', {
        message: briefing,
        type: 'focus'
      });

      // Native OS push notification
      await sendPushToUser(userId, '🌅 ResQ Morning Briefing', briefing, { tag: 'resq-briefing', url: '/' });

      user.lastBriefingDate = todayStr;
      await user.save();
    }
  } catch (err) {
    console.error('[AlertService] checkMorningBriefing error:', err);
  }
}

/**
 * Audits all active users for meetings (15m before), task deadlines (2h before), and habits (8 PM)
 */
export async function checkAlertTriggers() {
  console.log('[AlertService] Checking proactive alerts...');
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const users = await User.find({});

    for (const user of users) {
      const userId = user._id;
      const roomName = `user_${userId}`;

      // 1. PRE-MEETING ALERT (15 min before any calendar event)
      const minStart = new Date(now.getTime() + 14 * 60000);
      const maxStart = new Date(now.getTime() + 16 * 60000);

      const imminentEvents = await CalendarEvent.find({
        userId,
        startTime: { $gte: minStart, $lte: maxStart }
      });

      for (const event of imminentEvents) {
        const existing = await Notification.findOne({
          userId,
          type: 'event_reminder',
          title: `Starts in 15m: ${event.title}`,
          createdAt: { $gte: new Date(now.getTime() - 10 * 60000) }
        });

        if (!existing) {
          const message = `Just a heads up — your ${event.title} starts in 15 minutes.`;

          await Notification.create({
            userId,
            title: `Starts in 15m: ${event.title}`,
            message,
            type: 'event_reminder'
          });

          if (io) {
            console.log(`[AlertService] Sending pre-meeting alert to ${roomName} for "${event.title}"`);
            io.to(roomName).emit('resq:proactive_alert', {
              message,
              type: 'meeting'
            });
          }
          // Native OS push notification
          await sendPushToUser(userId, '📅 Meeting Starting Soon', message, { tag: `meeting-${event._id}`, url: '/dashboard?tab=calendar' });
        }
      }

      // 2. DEADLINE WARNING (2 hours before task due date)
      const minDue = new Date(now);
      const maxDue = new Date(now.getTime() + 2 * 3600000);

      const imminentTasks = await Task.find({
        userId,
        completed: false,
        dueDate: { $gte: minDue, $lte: maxDue }
      });

      for (const task of imminentTasks) {
        const existing = await Notification.findOne({
          userId,
          type: 'deadline_warning',
          title: `Due in 2h: ${task.title}`,
          createdAt: { $gte: new Date(now.getTime() - 2 * 3600000) }
        });

        if (!existing) {
          const message = `Your deadline for ${task.title} is in 2 hours. Want me to block focus time now?`;

          await Notification.create({
            userId,
            title: `Due in 2h: ${task.title}`,
            message,
            type: 'deadline_warning'
          });

          if (io) {
            console.log(`[AlertService] Sending deadline warning to ${roomName} for "${task.title}"`);
            io.to(roomName).emit('resq:proactive_alert', {
              message,
              type: 'deadline',
              taskId: task._id
            });
          }
        }
      }

      // 3. HABIT REMINDER (at 8 PM if target habit not completed)
      if (currentHour >= 20) {
        const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
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
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            const existing = await Notification.findOne({
              userId,
              type: 'habit_miss',
              title: `Reminder: ${habit.name}`,
              createdAt: { $gte: todayStart }
            });

            if (!existing) {
              const streak = habit.streak || 0;
              const message = `Don't forget your ${habit.name} habit today. You're on a ${streak}-day streak!`;

              await Notification.create({
                userId,
                title: `Reminder: ${habit.name}`,
                message,
                type: 'habit_miss'
              });

              if (io) {
                console.log(`[AlertService] Sending habit reminder to ${roomName} for "${habit.name}"`);
                io.to(roomName).emit('resq:proactive_alert', {
                  message,
                  type: 'focus'
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[AlertService] checkAlertTriggers failed:', err);
  }
}
