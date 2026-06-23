import { handleVoiceCommand } from '../services/geminiService.js';
import Task from '../models/Task.js';

export const handleSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user-specific socket rooms for scoped notifications
    socket.on('join-room', (userId) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    // Handle real-time Voice command transcriptions
    socket.on('voice-command', async (data) => {
      const { userId, commandText } = data;
      console.log(`Voice command from user ${userId}: ${commandText}`);

      try {
        const tasks = await Task.find({ userId: userId, completed: false });
        const parsedResponse = await handleVoiceCommand(commandText, { tasks });

        // Return parsed NLP command
        socket.emit('voice-response', parsedResponse);
      } catch (error) {
        console.error('Socket voice-command processing error:', error);
        socket.emit('voice-response', {
          action: 'error',
          responseText: 'Sorry, I encountered an issue processing your voice request.',
          parameters: {}
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
