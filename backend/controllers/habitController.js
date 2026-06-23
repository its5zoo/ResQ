import Habit from '../models/Habit.js';
import { generateHabitInsight } from '../services/geminiService.js';

export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHabit = async (req, res) => {
  const { name, title, targetDays } = req.body;

  try {
    const habit = new Habit({
      userId: req.user._id,
      name: name || title || 'New Habit',
      targetDays: targetDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      completions: [],
      streak: 0
    });

    const createdHabit = await habit.save();
    res.status(201).json(createdHabit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const completeHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (habit && habit.userId.toString() === req.user._id.toString()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already completed today
      const alreadyCompletedToday = habit.completions.some(c => {
        const compDate = new Date(c.date);
        compDate.setHours(0, 0, 0, 0);
        return compDate.getTime() === today.getTime() && c.completed;
      });

      if (!alreadyCompletedToday) {
        habit.completions.push({
          date: new Date(),
          completed: true
        });
        
        habit.streak = (habit.streak || 0) + 1;
      }

      const updatedHabit = await habit.save();

      // Return immediately
      res.json(updatedHabit);

      // Call Gemini habit insight asynchronously in background
      generateHabitInsight(updatedHabit, updatedHabit.completions)
        .then(async (result) => {
          if (result && (result.insight || result.tip)) {
            await Habit.findByIdAndUpdate(updatedHabit._id, {
              aiInsight: result.insight || '',
              aiTip: result.tip || ''
            });
            console.log(`[Habit AI] Asynchronously updated insight/tip for habit ${updatedHabit._id}`);
          }
        })
        .catch(err => {
          console.error('[Habit AI] Error generating habit insight in background:', err);
        });

    } else {
      res.status(404).json({ message: 'Habit not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (habit && habit.userId.toString() === req.user._id.toString()) {
      await habit.deleteOne();
      res.json({ message: 'Habit removed' });
    } else {
      res.status(404).json({ message: 'Habit not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
