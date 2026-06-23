import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import { handleVoiceCommand as queryGeminiVoice } from '../services/geminiService.js';

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

export const processVoiceCommand = async (req, res) => {
  const { transcript, commandText } = req.body;
  const command = transcript || commandText;

  if (!command) {
    return res.status(400).json({ message: 'Transcript or command text is required' });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({ userId: req.user._id });
    const todayEvents = await CalendarEvent.find({
      userId: req.user._id,
      startTime: { $gte: todayStart, $lte: todayEnd }
    });
    const habits = await Habit.find({ userId: req.user._id });
    const goals = await Goal.find({ userId: req.user._id });

    const userContext = {
      user: {
        name: req.user.name,
        email: req.user.email,
        theme: req.user.theme,
        plan: req.user.plan
      },
      tasks,
      todayEvents,
      habits,
      goals
    };

    const geminiResult = await queryGeminiVoice(command, userContext);
    const resultObj = typeof geminiResult === 'string' ? JSON.parse(geminiResult) : geminiResult;
    
    const { action, response, navigationTarget } = resultObj;

    if (action && action.type) {
      const payload = action.payload || {};

      if (action.type === 'add_task') {
        const newTask = new Task({
          userId: req.user._id,
          title: payload.title || 'New Task from Voice',
          description: payload.description || '',
          urgency: payload.urgency || 5,
          category: payload.category || 'General',
          completed: false,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(),
          estimatedMinutes: payload.estimatedMinutes || 30
        });
        await newTask.save();
        console.log('[Voice Action] Created task:', newTask.title);
      } 
      else if (action.type === 'complete_task') {
        const taskId = payload.taskId || payload.id;
        if (taskId) {
          await Task.findOneAndUpdate({ _id: taskId, userId: req.user._id }, { completed: true });
        } else if (payload.title) {
          await Task.findOneAndUpdate({ title: payload.title, userId: req.user._id }, { completed: true });
        }
        console.log('[Voice Action] Marked task complete');
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
          userId: req.user._id,
          title: payload.title || 'Scheduled by Voice',
          startTime: start,
          endTime: end || new Date(start.getTime() + 45 * 60000),
          type: payload.type || 'ai_block',
          layer: 'default',
          notes: 'Scheduled via ResQ Voice Assistant',
          aiGenerated: true
        });
        await newEvent.save();
        console.log('[Voice Action] Scheduled event:', newEvent.title);
      }
    }

    res.json({
      response: response || 'Command processed.',
      action: action || null,
      navigationTarget: navigationTarget || null
    });

  } catch (error) {
    console.error('Error processing voice command:', error);
    res.status(500).json({ message: error.message });
  }
};
