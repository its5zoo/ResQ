import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import { 
  generateDailySummary, 
  handleVoiceCommand, 
  generateGlobalPriority,
  generateForesightScan,
  generateRescuePlan,
  generatePreMortem,
  generateProcrastinationIntercept,
  generatePostMeetingExtraction,
  generateEnergySchedule
} from '../services/geminiService.js';

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

export const getGlobalPriority = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      userId: req.user._id,
      completed: false
    });

    const events = await CalendarEvent.find({
      userId: req.user._id,
      startTime: { $gte: todayStart, $lte: todayEnd }
    });

    const habits = await Habit.find({ userId: req.user._id });
    
    // Filter habits to those not completed today
    const incompleteHabits = habits.filter(h => {
      const todayStr = new Date().toDateString();
      const doneToday = h.completions?.some(c => new Date(c.date).toDateString() === todayStr && c.completed);
      return !doneToday;
    });

    const goals = await Goal.find({ userId: req.user._id, status: { $ne: 'completed' } });

    const globalPriorityList = await generateGlobalPriority(req.user, tasks, events, incompleteHabits, goals);
    res.json(globalPriorityList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getForesightScan = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, completed: false });
    const scanResult = await generateForesightScan(req.user, tasks);
    res.json(scanResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRescuePlan = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const task = await Task.findById(taskId);
    if (!task || task.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    const rescuePlan = await generateRescuePlan(req.user, task);
    res.json(rescuePlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPreMortem = async (req, res) => {
  try {
    const goalId = req.body.goalId || req.query.goalId;
    if (!goalId) {
      return res.status(400).json({ message: 'Goal ID is required' });
    }

    const goal = await Goal.findById(goalId);
    if (!goal || goal.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Goal not found or unauthorized' });
    }

    const preMortemResult = await generatePreMortem(req.user, goal);
    res.json(preMortemResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProcrastinationIntercept = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    const task = await Task.findById(taskId);
    if (!task || task.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    const strategy = await generateProcrastinationIntercept(req.user, task);
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const postMeetingIntelligence = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ message: 'Meeting transcript is required' });
    }

    const extraction = await generatePostMeetingExtraction(req.user, transcript);
    
    // Automatically create the extracted tasks
    if (extraction && extraction.tasks && Array.isArray(extraction.tasks)) {
      const createdTasks = [];
      for (const t of extraction.tasks) {
        const newTask = new Task({
          userId: req.user._id,
          title: t.title,
          urgency: t.urgency || 5,
          category: t.category || 'Meeting Action Item',
          dueDate: t.due ? new Date(Date.now() + (parseInt(t.due) || 1) * 86400000) : new Date(Date.now() + 86400000),
          estimatedMinutes: 30,
          completed: false
        });
        await newTask.save();
        createdTasks.push(newTask);
      }
      extraction.createdTasks = createdTasks;
    }

    res.json(extraction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEnergySchedule = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, completed: false });
    
    if (!tasks || tasks.length === 0) {
      return res.json({ message: 'No pending tasks to schedule.' });
    }

    const schedule = await generateEnergySchedule(req.user, tasks);
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
