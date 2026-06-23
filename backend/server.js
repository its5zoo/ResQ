import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handleSocketEvents } from './socket/socketHandler.js';

// Route Imports
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import habitRoutes from './routes/habits.js';
import goalRoutes from './routes/goals.js';
import calendarRoutes from './routes/calendar.js';
import notificationRoutes from './routes/notifications.js';
import aiAdvisorRoutes from './routes/aiAdvisor.js';
import voiceRoutes from './routes/voice.js';
import settingsRoutes from './routes/settings.js';

// Initialize environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Mount Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Bind Socket events
handleSocketEvents(io);

// Global Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Make Socket.IO instance accessible in request contexts
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes Mounts
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiAdvisorRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/settings', settingsRoutes);

// Base health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ResQ API is running smoothly' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
