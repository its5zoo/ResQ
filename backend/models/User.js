import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'matrix'],
    default: 'dark'
  },
  fontSize: {
    type: Number,
    default: 16
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' }
  },
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  lastBriefingDate: {
    type: String,
    default: null
  },
  voiceAI: {
    enabled: { type: Boolean, default: true },
    monthlyCommandsUsed: { type: Number, default: 0 },
    monthlyLimit: { type: Number, default: 30 },
    lastResetDate: { type: Date, default: Date.now },
    disabledReason: { 
      type: String, 
      enum: ['limit_reached', 'user_disabled', 'admin_disabled', null], 
      default: null 
    },
    voiceSpeed: { type: Number, default: 0.92 },
    voicePitch: { type: Number, default: 1.08 },
    ambientSound: { type: Boolean, default: true },
    proactiveAlerts: { type: Boolean, default: true }
  },
  googleAccessToken: {
    type: String,
    default: null
  },
  googleRefreshToken: {
    type: String,
    default: null
  },
  googleTokenExpiry: {
    type: Date,
    default: null
  },
  googleEmail: {
    type: String,
    default: null
  },
  googleCalendarDefaultIntegrated: {
    type: Boolean,
    default: true
  },
  notifications: {
    webPush: { type: Boolean, default: true },
    phonePush: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    deadlineAlerts: { type: Boolean, default: true }
  },
  pushSubscriptions: {
    type: [Object],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
