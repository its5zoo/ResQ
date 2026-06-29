import mongoose from 'mongoose';

const daySchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: Date, required: true },
  phase: { type: String, default: 'Core' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['learn', 'work', 'review', 'practice', 'project', 'rest'],
    default: 'work'
  },
  resourceHint: { type: String, default: '' },
  estimatedMinutes: { type: Number, default: 60 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  googleCalendarEventId: { type: String, default: null },
  skipped: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { _id: true });

const planSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // What kind of plan
  planType: {
    type: String,
    enum: ['study', 'project', 'career', 'fitness', 'exam', 'custom'],
    default: 'custom'
  },
  // Original user request phrase (e.g. "plan me 90 days python programming")
  originalRequest: { type: String, default: '' },
  // Main topic/title (e.g. "Python Programming", "Product Launch")
  topic: { type: String, required: true },
  // Answers collected during the smart Q&A (if any)
  interviewAnswers: { type: Object, default: {} },
  durationDays: { type: Number, required: true },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'not_applicable'],
    default: 'not_applicable'
  },
  dailyMinutes: { type: Number, default: 60 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active'
  },
  currentDay: { type: Number, default: 1 },
  completedDays: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  lastCompletedAt: { type: Date, default: null },
  // HH:MM format - when to send daily reminder
  reminderTime: { type: String, default: '09:00' },
  calendarSynced: { type: Boolean, default: false },
  googleCalendarLink: { type: String, default: null },
  days: [daySchema],
  createdAt: { type: Date, default: Date.now }
});

// Index for cron query: find active plans at a given reminderTime
planSchema.index({ status: 1, reminderTime: 1 });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
