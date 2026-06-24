import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import { generateDailySummary, handleVoiceCommand } from '../services/geminiService.js';

export const getDailySummary = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      userId: req.user._id,
      $or: [
        { dueDate: { $gte: todayStart, $lte: todayEnd } },
        { completed: false }
      ]
    });

    const events = await CalendarEvent.find({
      userId: req.user._id,
      startTime: { $gte: todayStart, $lte: todayEnd }
    });

    const habits = await Habit.find({ userId: req.user._id });
    const goals = await Goal.find({ userId: req.user._id });

    const summary = await generateDailySummary(req.user, tasks, events, habits, goals);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const askAdvisor = async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ message: 'Question is required' });
  }

  try {
    const tasks = await Task.find({ userId: req.user._id });
    const events = await CalendarEvent.find({ userId: req.user._id });
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
      calendarEvents: events,
      habits,
      goals
    };

    const aiResponse = await handleVoiceCommand(question, userContext);
    const responseObj = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
    res.json(responseObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
