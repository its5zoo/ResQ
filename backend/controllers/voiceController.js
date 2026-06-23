import Task from '../models/Task.js';
import { handleVoiceCommand } from '../services/geminiService.js';

export const handleVoiceCommand = async (req, res) => {
  const { commandText } = req.body;

  if (!commandText) {
    return res.status(400).json({ message: 'Command text is required' });
  }

  try {
    const tasks = await Task.find({ userId: req.user._id, completed: false });
    const parsed = await handleVoiceCommand(commandText, { tasks });
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
