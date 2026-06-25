import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { verifyModelConfig } from './config/gemini.js';
import { handleSocketEvents, io } from './socket/socketHandler.js';
import { startCronJobs } from './services/cronService.js';

// Middleware Imports
import { protect } from './middleware/authMiddleware.js';
import { checkGeminiKey } from './middleware/geminiCheck.js';
import { aiVoiceLimiter } from './middleware/rateLimiter.js';

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
import googleCalendarRoutes from './routes/googleCalendar.js';
import pushRoutes from './routes/push.js';
import subscriptionRoutes from './routes/subscription.js';

// Initialize environment variables
dotenv.config();

// Startup check for GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
  console.warn('\x1b[33m%s\x1b[0m', '[Warning] GEMINI_API_KEY is missing or configured with a placeholder. AI and Voice features will return 503.');
}

// Connect to MongoDB
connectDB();

// Initialize cron scheduler
startCronJobs();

const app = express();
const server = http.createServer(app);

// Bind Socket events
handleSocketEvents(server);

// Global Middlewares
app.use(helmet());

const allowedOrigins = Array.from(new Set([
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
].filter(Boolean)));

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Make Socket.IO instance accessible in request contexts
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Verify Gemini Model Configuration on startup before routes mount
verifyModelConfig();

// API Routes Mounts
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', protect, checkGeminiKey, aiVoiceLimiter, aiAdvisorRoutes);

// Diagnostic test routes (no middleware)
app.get('/api/voice/ping', (req, res) => {
  res.json({ ok: true, message: 'Voice API ping test successful (no middleware).' });
});
app.get('/api/voice/gemini-test', async (req, res) => {
  try {
    const { getResQModel } = await import('./config/gemini.js');
    const model = getResQModel();
    const result = await model.generateContent("Say hello as ResQ in one sentence");
    const text = result.response.text().trim();
    res.json({ ok: true, response: text });
  } catch (error) {
    console.error('Gemini test route failed:', error);
    res.status(500).json({ ok: false, error: error.message, stack: error.stack });
  }
});

app.use('/api/voice', protect, checkGeminiKey, aiVoiceLimiter, voiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/google', googleCalendarRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/subscription', subscriptionRoutes);

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
