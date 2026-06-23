import CalendarEvent from '../models/CalendarEvent.js';
import Task from '../models/Task.js';
import { autoScheduleTasks } from '../services/schedulerService.js';

export const getEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find({ user: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, layerType, day, timeSlot, duration, description } = req.body;

  try {
    // Conflict check
    const conflict = await CalendarEvent.findOne({ user: req.user._id, day, timeSlot });
    if (conflict) {
      return res.status(400).json({ message: 'Conflict detected: A slot is already booked at this time!' });
    }

    const event = new CalendarEvent({
      user: req.user._id,
      title,
      layerType,
      day,
      timeSlot,
      duration,
      description
    });

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (event && event.user.toString() === req.user._id.toString()) {
      event.title = req.body.title || event.title;
      event.layerType = req.body.layerType || event.layerType;
      event.day = req.body.day || event.day;
      event.timeSlot = req.body.timeSlot || event.timeSlot;
      event.duration = req.body.duration !== undefined ? req.body.duration : event.duration;
      event.description = req.body.description !== undefined ? req.body.description : event.description;

      const updatedEvent = await event.save();
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Calendar event not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);

    if (event && event.user.toString() === req.user._id.toString()) {
      await event.deleteOne();
      res.json({ message: 'Calendar event removed' });
    } else {
      res.status(404).json({ message: 'Calendar event not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const autoSchedule = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id, completed: false });
    const scheduled = await autoScheduleTasks(req.user._id, tasks);
    res.json({ message: `Successfully scheduled ${scheduled.length} tasks!`, scheduled });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
