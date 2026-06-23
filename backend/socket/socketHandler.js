import { handleVoiceCommand } from '../services/geminiService.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';

// Helper to parse day/time into Date object
const parseDayTimeToDate = (dayName, timeStr) => {
  const days = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const targetDayNum = days[dayName.toLowerCase().substring(0, 3)];
  const date = new Date();
  if (targetDayNum === undefined) return date;

  const currentDayNum = date.getDay();
  let diff = targetDayNum - currentDayNum;
  if (diff < 0) {
    diff += 7;
  }
  date.setDate(date.getDate() + diff);

  let hours = 9;
  let minutes = 0;
  
  const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1]);
    minutes = parseInt(ampmMatch[2]);
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  } else {
    const plainMatch = timeStr.match(/(\d+):(\d+)/);
    if (plainMatch) {
      hours = parseInt(plainMatch[1]);
      minutes = parseInt(plainMatch[2]);
    }
  }
  
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const handleSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user-specific socket rooms for scoped notifications
    socket.on('join-room', (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    // Handle real-time Voice command transcriptions
    socket.on('voice-command', async (data) => {
      const { userId, commandText } = data;
      console.log(`Voice command from user ${userId}: ${commandText}`);

      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Fetch user context
        const tasks = await Task.find({ userId });
        const todayEvents = await CalendarEvent.find({
          userId,
          startTime: { $gte: todayStart, $lte: todayEnd }
        });
        const habits = await Habit.find({ userId });
        const goals = await Goal.find({ userId });

        const userContext = {
          tasks,
          todayEvents,
          habits,
          goals
        };

        const geminiResult = await handleVoiceCommand(commandText, userContext);
        const resultObj = typeof geminiResult === 'string' ? JSON.parse(geminiResult) : geminiResult;

        const { action, response, navigationTarget } = resultObj;

        // Process action in DB
        if (action && action.type) {
          const payload = action.payload || {};

          if (action.type === 'add_task') {
            const newTask = new Task({
              userId,
              title: payload.title || 'New Task from Voice',
              description: payload.description || '',
              urgency: payload.urgency || 5,
              category: payload.category || 'General',
              completed: false,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(),
              estimatedMinutes: payload.estimatedMinutes || 30
            });
            await newTask.save();
            console.log(`[Socket Voice Action] Created task: ${newTask.title}`);
          } 
          else if (action.type === 'complete_task') {
            const taskId = payload.taskId || payload.id;
            if (taskId) {
              await Task.findOneAndUpdate({ _id: taskId, userId }, { completed: true });
            } else if (payload.title) {
              await Task.findOneAndUpdate({ title: payload.title, userId }, { completed: true });
            }
            console.log('[Socket Voice Action] Marked task complete');
          } 
          else if (action.type === 'schedule_task') {
            let start = payload.startTime ? new Date(payload.startTime) : null;
            let end = payload.endTime ? new Date(payload.endTime) : null;
            if (!start && payload.day && payload.timeSlot) {
              start = parseDayTimeToDate(payload.day, payload.timeSlot);
              const dur = payload.duration || 45;
              end = new Date(start.getTime() + dur * 60000);
            }
            if (!start) {
              start = new Date();
              end = new Date(start.getTime() + 45 * 60000);
            }

            const newEvent = new CalendarEvent({
              userId,
              title: payload.title || 'Scheduled by Voice',
              startTime: start,
              endTime: end || new Date(start.getTime() + 45 * 60000),
              type: payload.type || 'ai_block',
              layer: 'default',
              notes: 'Scheduled via ResQ Socket Voice Assistant',
              aiGenerated: true
            });
            await newEvent.save();
            console.log(`[Socket Voice Action] Scheduled event: ${newEvent.title}`);
          }
        }

        // Return parsed NLP command response to the client
        socket.emit('voice-response', {
          response: response || 'Command processed.',
          action: action || null,
          navigationTarget: navigationTarget || null
        });

      } catch (error) {
        console.error('Socket voice-command processing error:', error);
        socket.emit('voice-response', {
          action: 'error',
          response: 'Sorry, I encountered an issue processing your voice request.',
          navigationTarget: null
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
