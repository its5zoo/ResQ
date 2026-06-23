import CalendarEvent from '../models/CalendarEvent.js';
import Task from '../models/Task.js';
import { generateAutoSchedule } from '../services/geminiService.js';
import { io } from '../socket/socketHandler.js';

// Helper to parse day/time into Date object
const parseDayTimeToDate = (dayName, timeStr) => {
  const days = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const targetDayNum = days[dayName.toLowerCase().substring(0, 3)];
  const date = new Date();
  if (targetDayNum === undefined) return date;

  const currentDayNum = date.getDay();
  let diff = targetDayNum - currentDayNum;
  if (diff < 0) {
    diff += 7;
  }
  date.setDate(date.getDate() + diff);

  let hours = 9;
  let minutes = 0;
  
  const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1]);
    minutes = parseInt(ampmMatch[2]);
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  } else {
    const plainMatch = timeStr.match(/(\d+):(\d+)/);
    if (plainMatch) {
      hours = parseInt(plainMatch[1]);
      minutes = parseInt(plainMatch[2]);
    }
  }
  
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const getEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find({ userId: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, startTime, endTime, type, taskId, layer, notes, aiGenerated } = req.body;

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Conflict check - check if there's an overlapping event for the same user
    const conflict = await CalendarEvent.findOne({
      userId: req.user._id,
      $or: [
        { startTime: { $lt: end, $gt: start } },
        { endTime: { $gt: start, $lt: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (conflict) {
      return res.status(400).json({ message: 'Conflict detected: A slot is already booked at this time!' });
    }

    const event = new CalendarEvent({
      userId: req.user._id,
      title,
      startTime: start,
      endTime: end,
      type: type || 'user_block',
      taskId: taskId || null,
      layer: layer || 'default',
      notes: notes || '',
      aiGenerated: aiGenerated || false
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

    if (event && event.userId.toString() === req.user._id.toString()) {
      event.title = req.body.title !== undefined ? req.body.title : event.title;
      event.startTime = req.body.startTime !== undefined ? new Date(req.body.startTime) : event.startTime;
      event.endTime = req.body.endTime !== undefined ? new Date(req.body.endTime) : event.endTime;
      event.type = req.body.type !== undefined ? req.body.type : event.type;
      event.taskId = req.body.taskId !== undefined ? req.body.taskId : event.taskId;
      event.layer = req.body.layer !== undefined ? req.body.layer : event.layer;
      event.notes = req.body.notes !== undefined ? req.body.notes : event.notes;
      event.aiGenerated = req.body.aiGenerated !== undefined ? req.body.aiGenerated : event.aiGenerated;

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

    if (event && event.userId.toString() === req.user._id.toString()) {
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
    const pendingTasks = await Task.find({ userId: req.user._id, completed: false });
    const existingEvents = await CalendarEvent.find({ userId: req.user._id });

    const workingHours = req.user.workingHours || { start: '09:00', end: '18:00' };

    const formattedTasks = pendingTasks.map(t => ({
      _id: t._id,
      title: t.title,
      duration: t.estimatedMinutes || 30
    }));

    const formattedEvents = existingEvents.map(e => ({
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
      type: e.type
    }));

    const aiSchedule = await generateAutoSchedule(formattedTasks, formattedEvents, workingHours);

    const createdEvents = [];
    if (Array.isArray(aiSchedule)) {
      for (const item of aiSchedule) {
        const start = parseDayTimeToDate(item.day || 'Mon', item.timeSlot || '09:00 AM');
        const durationMin = item.duration || 45;
        const end = new Date(start.getTime() + durationMin * 60000);

        const newEvent = new CalendarEvent({
          userId: req.user._id,
          title: item.title || `AI Focus block: ${item.taskId}`,
          startTime: start,
          endTime: end,
          type: item.type || 'ai_block',
          taskId: item.taskId && item.taskId !== 'task_id' ? item.taskId : null,
          layer: 'default',
          notes: 'Auto-scheduled by ResQ AI',
          aiGenerated: true
        });

        const savedEvent = await newEvent.save();
        createdEvents.push(savedEvent);
      }
    }

    if (io) {
      io.to(`user_${req.user._id}`).emit('calendar:new-events', createdEvents);
    }

    res.json(createdEvents);
  } catch (error) {
    console.error('Auto Schedule Error:', error);
    res.status(500).json({ message: error.message });
  }
};
