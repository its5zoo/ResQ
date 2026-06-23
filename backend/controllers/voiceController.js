import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import { handleVoiceCommand as queryGeminiVoice } from '../services/geminiService.js';
import { reprioritizeTasksForUser } from './taskController.js';
import { io } from '../socket/socketHandler.js';

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

export const executeVoiceCommand = async (userId, transcript) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const tasks = await Task.find({ userId });
  const todayEvents = await CalendarEvent.find({
    userId,
    startTime: { $gte: todayStart, $lte: todayEnd }
  });
  const habits = await Habit.find({ userId });
  const goals = await Goal.find({ userId });

  const userContext = {
    user: {
      id: userId
    },
    tasks,
    todayEvents,
    habits,
    goals
  };

  const geminiResult = await queryGeminiVoice(transcript, userContext);
  const resultObj = typeof geminiResult === 'string' ? JSON.parse(geminiResult) : geminiResult;
  
  const { action, response, navigationTarget } = resultObj;

  let taskModified = false;
  let calendarModified = false;
  let createdEvents = [];

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
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    } 
    else if (action.type === 'complete_task') {
      const taskId = payload.taskId || payload.id;
      if (taskId) {
        await Task.findOneAndUpdate({ _id: taskId, userId }, { completed: true });
      } else if (payload.title) {
        await Task.findOneAndUpdate({ title: payload.title, userId }, { completed: true });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
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
        notes: 'Scheduled via ResQ Voice Assistant',
        aiGenerated: true
      });
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      calendarModified = true;
    }
  }

  if (io) {
    const room = `user_${userId}`;
    if (taskModified) {
      const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('tasks:updated', updatedTasks);
      
      const incompleteTasks = await Task.find({ userId, completed: false }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('ai:priority-update', incompleteTasks);
    }
    if (calendarModified) {
      io.to(room).emit('calendar:new-events', createdEvents);
    }
  }

  return { response, action, navigationTarget };
};

export const processVoiceCommand = async (req, res) => {
  const { transcript, commandText } = req.body;
  const command = transcript || commandText;

  if (!command) {
    return res.status(400).json({ message: 'Transcript or command text is required' });
  }

  try {
    const result = await executeVoiceCommand(req.user._id, command);
    res.json(result);
  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({ message: error.message });
  }
};
