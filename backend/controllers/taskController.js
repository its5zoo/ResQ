import Task from '../models/Task.js';

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ urgency: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  const { title, urgency, dueDate, duration, category } = req.body;

  try {
    const task = new Task({
      user: req.user._id,
      title,
      urgency,
      dueDate,
      duration,
      category,
      subtasks: []
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (task && task.user.toString() === req.user._id.toString()) {
      task.title = req.body.title || task.title;
      task.urgency = req.body.urgency !== undefined ? req.body.urgency : task.urgency;
      task.dueDate = req.body.dueDate || task.dueDate;
      task.duration = req.body.duration !== undefined ? req.body.duration : task.duration;
      task.category = req.body.category || task.category;
      task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;
      task.subtasks = req.body.subtasks || task.subtasks;

      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (task && task.user.toString() === req.user._id.toString()) {
      await task.deleteOne();
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
