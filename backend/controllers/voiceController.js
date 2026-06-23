import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';
import { resolveClarification, clearPendingCommands } from '../services/voiceIntentService.js';
import { reprioritizeTasksForUser } from './taskController.js';
import { io } from '../socket/socketHandler.js';

export const executeVoiceCommand = async (userId, transcript) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // 1. Settings toggle gate check
  if (user.voiceAI && user.voiceAI.enabled === false) {
    let msg = 'Voice assistant is currently disabled in your settings.';
    if (user.voiceAI.disabledReason === 'limit_reached') {
      msg = 'Monthly voice AI limit reached. Upgrade to Premium for unlimited access.';
    }
    return {
      intent: 'out_of_scope',
      confidence: 1.0,
      extractedData: {},
      missingFields: [],
      clarificationQuestion: null,
      response: msg,
      action: null,
      navigationTarget: null,
      suggestAlternative: null
    };
  }

  // Call voiceIntentService to resolve command/clarification
  const resultObj = await resolveClarification(userId, transcript);
  
  const intent = resultObj.intent;
  const payload = resultObj.extractedData || {};

  let taskModified = false;
  let calendarModified = false;
  let habitsModified = false;
  let goalsModified = false;
  let createdEvents = [];

  try {
    if (intent === 'create_task') {
      const newTask = new Task({
        userId,
        title: payload.title || 'New Task from Voice',
        urgency: payload.urgency || 5,
        category: payload.category || 'General',
        completed: false,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 86400000), // Default to tomorrow
        estimatedMinutes: payload.estimatedMinutes || payload.durationMinutes || 30
      });
      const savedTask = await newTask.save();
      await reprioritizeTasksForUser(userId);
      taskModified = true;
      resultObj.createdTaskId = savedTask._id;
    }
    else if (intent === 'complete_task') {
      const taskId = payload.taskId;
      if (taskId) {
        await Task.findOneAndUpdate({ _id: taskId, userId }, { completed: true });
      } else if (payload.title) {
        await Task.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, { completed: true });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'update_task_priority') {
      const taskId = payload.taskId;
      const urgency = payload.urgency;
      if (taskId && urgency) {
        await Task.findOneAndUpdate({ _id: taskId, userId }, { urgency });
      } else if (payload.title && urgency) {
        await Task.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, { urgency });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'delete_task') {
      const taskId = payload.taskId;
      if (taskId) {
        await Task.findOneAndDelete({ _id: taskId, userId });
      } else if (payload.title) {
        await Task.findOneAndDelete({ title: new RegExp(payload.title, 'i'), userId });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'schedule_event') {
      const start = payload.startTime ? new Date(payload.startTime) : new Date();
      const duration = payload.durationMinutes || 45;
      const end = payload.endTime ? new Date(payload.endTime) : new Date(start.getTime() + duration * 60000);

      const newEvent = new CalendarEvent({
        userId,
        title: payload.title || 'Scheduled by Voice',
        startTime: start,
        endTime: end,
        type: payload.type || 'ai_block',
        layer: 'default',
        notes: payload.notes || 'Scheduled via ResQ Voice Assistant',
        aiGenerated: true
      });
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      calendarModified = true;
      resultObj.createdEventId = savedEvent._id;
    }
    else if (intent === 'reschedule_event') {
      const eventId = payload.eventId;
      const start = payload.newStartTime ? new Date(payload.newStartTime) : null;
      const end = payload.newEndTime ? new Date(payload.newEndTime) : null;
      
      if (eventId && start) {
        const update = { startTime: start };
        if (end) update.endTime = end;
        await CalendarEvent.findOneAndUpdate({ _id: eventId, userId }, update);
        calendarModified = true;
      } else if (payload.title && start) {
        const update = { startTime: start };
        if (end) update.endTime = end;
        await CalendarEvent.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, update);
        calendarModified = true;
      }
    }
    else if (intent === 'cancel_event') {
      const eventId = payload.eventId;
      if (eventId) {
        await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
        calendarModified = true;
      } else if (payload.title) {
        await CalendarEvent.findOneAndDelete({ title: new RegExp(payload.title, 'i'), userId });
        calendarModified = true;
      }
    }
    else if (intent === 'create_habit') {
      const newHabit = new Habit({
        userId,
        name: payload.name || 'New Habit',
        targetDays: payload.targetDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        completions: [],
        streak: 0
      });
      await newHabit.save();
      habitsModified = true;
    }
    else if (intent === 'complete_habit') {
      const habitId = payload.habitId;
      let habit;
      if (habitId) {
        habit = await Habit.findOne({ _id: habitId, userId });
      } else if (payload.name) {
        habit = await Habit.findOne({ name: new RegExp(payload.name, 'i'), userId });
      }

      if (habit) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const alreadyCompleted = habit.completions.some(c => {
          const d = new Date(c.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === todayDate.getTime() && c.completed;
        });

        if (!alreadyCompleted) {
          habit.completions.push({ date: new Date(), completed: true });
          habit.streak = (habit.streak || 0) + 1;
          await habit.save();
          habitsModified = true;
        }
      }
    }
    else if (intent === 'update_goal_progress') {
      const goalId = payload.goalId;
      const progress = parseFloat(payload.progressPercent);
      if (goalId && !isNaN(progress)) {
        await Goal.findOneAndUpdate({ _id: goalId, userId }, { progress });
        goalsModified = true;
      } else if (payload.title && !isNaN(progress)) {
        await Goal.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, { progress });
        goalsModified = true;
      }
    }
    else if (intent === 'set_focus_session') {
      const duration = parseInt(payload.durationMinutes) || 25;
      const title = payload.taskId ? `AI Focus block: Focus on Task` : `AI Focus block: Focus Session`;
      const start = new Date();
      const end = new Date(start.getTime() + duration * 60000);

      const newEvent = new CalendarEvent({
        userId,
        title,
        startTime: start,
        endTime: end,
        type: 'ai_block',
        layer: 'default',
        notes: 'Focus session started via ResQ Voice Assistant',
        aiGenerated: true
      });
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      calendarModified = true;
      
      resultObj.uiAction = {
        type: 'start_focus',
        payload: { task: payload.taskId || 'Deep Work Session', duration }
      };
    }
  } catch (dbErr) {
    console.error('[voiceController] DB action failed:', dbErr);
  }

  // Socket notification emits
  if (io) {
    const room = `user_${userId}`;
    if (taskModified) {
      const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('tasks:updated', updatedTasks);
      const incompleteTasks = await Task.find({ userId, completed: false }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('ai:priority-update', incompleteTasks);
    }
    if (calendarModified) {
      const allEvents = await CalendarEvent.find({ userId });
      io.to(room).emit('calendar:new-events', createdEvents);
      io.to(room).emit('calendar:updated', allEvents);
    }
    if (habitsModified) {
      const updatedHabits = await Habit.find({ userId });
      io.to(room).emit('habits:updated', updatedHabits);
    }
    if (goalsModified) {
      const updatedGoals = await Goal.find({ userId });
      io.to(room).emit('goals:updated', updatedGoals);
    }
  }

  return {
    intent: resultObj.intent,
    confidence: resultObj.confidence,
    extractedData: resultObj.extractedData,
    missingFields: resultObj.missingFields,
    clarificationQuestion: resultObj.clarificationQuestion,
    response: resultObj.voiceResponse || 'Command processed.',
    action: resultObj.uiAction || (resultObj.suggestAlternative ? { type: 'suggest_alternative', payload: { alternative: resultObj.suggestAlternative } } : null),
    navigationTarget: resultObj.navigationTarget,
    suggestAlternative: resultObj.suggestAlternative,
    createdTaskId: resultObj.createdTaskId,
    createdEventId: resultObj.createdEventId
  };
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

export const clearVoiceCache = async (req, res) => {
  try {
    clearPendingCommands(req.user._id);
    res.status(200).json({ message: 'Voice AI pending clarification cache cleared.' });
  } catch (error) {
    console.error('Error clearing voice cache:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getVoiceUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enabled = user.voiceAI?.enabled ?? true;
    const used = user.voiceAI?.monthlyCommandsUsed ?? 0;
    const limit = user.voiceAI?.monthlyLimit ?? 30;
    const remaining = Math.max(0, limit - used);
    const plan = user.plan || 'free';
    const disabledReason = user.voiceAI?.disabledReason ?? null;

    res.json({
      enabled,
      used,
      limit,
      remaining,
      plan,
      disabledReason
    });
  } catch (error) {
    console.error('Error fetching voice usage:', error);
    res.status(500).json({ message: error.message });
  }
};


