import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Task from '../models/Task.js';
import { reprioritizeTasksForUser } from '../controllers/taskController.js';
import { executeVoiceCommand } from '../controllers/voiceController.js';
import { scheduleFocusBlockForTask } from '../services/smartSchedulerService.js';
import { checkAndIncrementVoiceUsage } from '../middleware/voiceGate.js';

export let io = null;

export const handleSocketEvents = (server) => {
  const allowedOrigins = Array.from(new Set([
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ].filter(Boolean)));

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Authenticate socket connections using JWT from handshake.auth.token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'resq-dev-only-secret-change-in-prod');
      socket.user = decoded; // decoded contains the user ID under decoded.id
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const roomName = `user_${userId}`;
    
    // Join user to room user_${userId} on connect
    socket.join(roomName);
    console.log(`Socket ${socket.id} authenticated and joined room ${roomName}`);

    // Trigger morning briefing if applicable (Disabled per user request to only speak on manual query)
    // checkMorningBriefing(socket, userId);

    // voice:transcript event
    socket.on('voice:transcript', async (data) => {
      const { transcript, tzOffsetMinutes, localISOTime } = data;
      if (!transcript) return;

      try {
        console.log(`[Socket Voice] Transcript from ${userId}: ${transcript} (tz offset: ${tzOffsetMinutes}min)`);
        
        // Apply voice usage/limits checks
        const check = await checkAndIncrementVoiceUsage(userId);
        if (check.blocked) {
          return socket.emit('voice:response', {
            blocked: true,
            reason: check.reason,
            response: check.message,
            action: null,
            navigationTarget: null
          });
        }

        const result = await executeVoiceCommand(userId, transcript, { tzOffsetMinutes, localISOTime });
        
        // Emit voice:response to the user
        socket.emit('voice:response', result);
      } catch (err) {
        console.error('[Socket Voice] Error processing transcript:', err);
        socket.emit('voice:response', {
          response: 'Error processing voice command.',
          action: null,
          navigationTarget: null
        });
      }
    });

    // task:create event
    socket.on('task:create', async (data) => {
      try {
        const { title, description, urgency, category, estimatedMinutes, duration, dueDate } = data;
        
        const newTask = new Task({
          userId,
          title: title || 'New Task',
          description: description || '',
          urgency: urgency || 5,
          category: category || 'General',
          completed: false,
          estimatedMinutes: estimatedMinutes || duration || 30,
          dueDate: dueDate ? new Date(dueDate) : new Date()
        });

        await newTask.save();
        console.log(`[Socket Task] Created task for user ${userId}: ${newTask.title}`);
        
        // Re-prioritize all tasks
        await reprioritizeTasksForUser(userId);

        // Emit tasks:updated to user's room
        const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
        io.to(roomName).emit('tasks:updated', updatedTasks);
      } catch (err) {
        console.error('[Socket Task] Error creating task:', err);
      }
    });

    // task:complete event
    socket.on('task:complete', async (data) => {
      try {
        const { id, taskId } = data;
        const targetId = id || taskId;
        if (!targetId) return;

        await Task.findOneAndUpdate({ _id: targetId, userId }, { completed: true });
        console.log(`[Socket Task] Completed task ${targetId} for user ${userId}`);

        // Re-prioritize
        await reprioritizeTasksForUser(userId);

        // Emit tasks:updated to user's room
        const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
        io.to(roomName).emit('tasks:updated', updatedTasks);
      } catch (err) {
        console.error('[Socket Task] Error completing task:', err);
      }
    });

    socket.on('resq:create_deadline_focus', async (data) => {
      try {
        const { taskId } = data;
        if (!taskId) return;
        const created = await scheduleFocusBlockForTask(userId, taskId);
        if (created) {
          console.log(`[Socket] Created proactive focus block for task ${taskId}: ${created.title}`);
          io.to(roomName).emit('calendar:new-events');
        }
      } catch (err) {
        console.error('[Socket] Error in resq:create_deadline_focus:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user ${userId})`);
    });
  });

  return io;
};
