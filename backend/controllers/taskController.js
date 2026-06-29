import Task from '../models/Task.js';
import { generateTaskPriority } from '../services/geminiService.js';
import { io } from '../socket/socketHandler.js';

export const reprioritizeTasksForUser = async (userId) => {
  try {
    const tasks = await Task.find({ userId, completed: false });
    if (tasks.length === 0) {
      if (io) {
        const room = `user_${userId}`;
        const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
        io.to(room).emit('tasks:updated', updatedTasks);
        io.to(room).emit('ai:priority-update', []);
      }
      return;
    }

    const prioritized = await generateTaskPriority(tasks);
    if (Array.isArray(prioritized)) {
      for (let i = 0; i < prioritized.length; i++) {
        const item = prioritized[i];
        const taskId = item.id || item._id || item.taskId;
        if (taskId) {
          await Task.findOneAndUpdate(
            { _id: taskId, userId },
            { aiPriorityRank: i + 1, aiReason: item.reason || '' }
          );
        }
      }
    }

    // Emit real-time events to user's room
    if (io) {
      const room = `user_${userId}`;
      const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('tasks:updated', updatedTasks);

      const incompleteTasks = await Task.find({ userId, completed: false }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('ai:priority-update', incompleteTasks);
    }
  } catch (error) {
    console.error('Error in reprioritizeTasksForUser:', error);
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ aiPriorityRank: 1, urgency: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  const { title, description, urgency, category, completed, subtasks, estimatedMinutes, duration, dueDate } = req.body;

  try {
    let finalUrgency = urgency;
    if (!urgency) {
      const { inferTaskUrgency } = await import('../services/geminiService.js');
      finalUrgency = await inferTaskUrgency(title, dueDate || new Date());
    }

    const task = new Task({
      userId: req.user._id,
      title,
      description: description || '',
      urgency: finalUrgency,
      category: category || 'General',
      completed: completed || false,
      subtasks: subtasks || [],
      estimatedMinutes: estimatedMinutes || duration || 30,
      dueDate: dueDate || new Date()
    });

    const createdTask = await task.save();

    // Re-rank all tasks for this user (this will also emit Socket.IO events)
    await reprioritizeTasksForUser(req.user._id);

    const refetchedTask = await Task.findById(createdTask._id);
    res.status(201).json(refetchedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (task && task.userId.toString() === req.user._id.toString()) {
      const urgencyChanged = req.body.urgency !== undefined && req.body.urgency !== task.urgency;
      const dueDateChanged = req.body.dueDate !== undefined && req.body.dueDate !== task.dueDate;
      const completedChanged = req.body.completed !== undefined && req.body.completed !== task.completed;

      task.title = req.body.title !== undefined ? req.body.title : task.title;
      task.description = req.body.description !== undefined ? req.body.description : task.description;
      task.urgency = req.body.urgency !== undefined ? req.body.urgency : task.urgency;
      task.category = req.body.category !== undefined ? req.body.category : task.category;
      task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;
      task.subtasks = req.body.subtasks !== undefined ? req.body.subtasks : task.subtasks;
      task.estimatedMinutes = req.body.estimatedMinutes !== undefined ? req.body.estimatedMinutes : (req.body.duration !== undefined ? req.body.duration : task.estimatedMinutes);
      task.dueDate = req.body.dueDate !== undefined ? req.body.dueDate : task.dueDate;
      task.aiPriorityRank = req.body.aiPriorityRank !== undefined ? req.body.aiPriorityRank : task.aiPriorityRank;
      task.aiReason = req.body.aiReason !== undefined ? req.body.aiReason : task.aiReason;

      const updatedTask = await task.save();

      // Trigger automatic reprioritization if key fields changed
      if (urgencyChanged || dueDateChanged || completedChanged) {
        await reprioritizeTasksForUser(req.user._id);
        const refetchedTask = await Task.findById(updatedTask._id);
        return res.json(refetchedTask);
      }

      // If no re-ranking occurred, still emit task update event
      if (io) {
        const room = `user_${req.user._id}`;
        const updatedTasks = await Task.find({ userId: req.user._id }).sort({ aiPriorityRank: 1, urgency: -1 });
        io.to(room).emit('tasks:updated', updatedTasks);
      }

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

    if (task && task.userId.toString() === req.user._id.toString()) {
      await task.deleteOne();
      await reprioritizeTasksForUser(req.user._id);
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const manualReprioritize = async (req, res) => {
  try {
    await reprioritizeTasksForUser(req.user._id);
    const tasks = await Task.find({ userId: req.user._id }).sort({ aiPriorityRank: 1, urgency: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
