import Habit from '../models/Habit.js';

export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id });
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createHabit = async (req, res) => {
  const { title, targetDays } = req.body;

  try {
    const habit = new Habit({
      user: req.user._id,
      title,
      targetDays
    });

    const createdHabit = await habit.save();
    res.status(201).json(createdHabit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (habit && habit.user.toString() === req.user._id.toString()) {
      habit.title = req.body.title || habit.title;
      habit.streak = req.body.streak !== undefined ? req.body.streak : habit.streak;
      habit.completedToday = req.body.completedToday !== undefined ? req.body.completedToday : habit.completedToday;
      habit.targetDays = req.body.targetDays || habit.targetDays;
      habit.history = req.body.history || habit.history;

      const updatedHabit = await habit.save();
      res.json(updatedHabit);
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

    if (habit && habit.user.toString() === req.user._id.toString()) {
      await habit.deleteOne();
      res.json({ message: 'Habit removed' });
    } else {
      res.status(404).json({ message: 'Habit not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
