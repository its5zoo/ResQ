import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import { generateAdvisorPrompt } from '../services/geminiService.js';

export const getAdvisorPrompt = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    const habits = await Habit.find({ user: req.user._id });
    
    const advice = await generateAdvisorPrompt(tasks, habits);
    res.json({ advice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
