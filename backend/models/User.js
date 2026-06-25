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
  phone: {
    type: String,
    default: null,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'trial', 'premium'],
    default: 'free'
  },

  // ── Free Trial ───────────────────────────────────────────────────────────────
  trial_claimed: {
    type: Boolean,
    default: false
  },
  trial_start_date: {
    type: Date,
    default: null
  },
  trial_end_date: {
    type: Date,
    default: null
  },

  // ── Subscription ─────────────────────────────────────────────────────────────
  subscription_type: {
    type: String,
    enum: ['monthly', 'yearly', 'none'],
    default: 'none'
  },
  subscription_status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'none'],
    default: 'none'
  },
  subscription_start: {
    type: Date,
    default: null
  },
  subscription_end: {
    type: Date,
    default: null
  },
  last_payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },

  // ── UI / App Settings (existing) ─────────────────────────────────────────────
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
}, {
  // Enable virtuals in toJSON so they're included in API responses
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual: isPremiumActive
 * Returns true when the user currently has valid premium access via:
 *   a) An active free trial that has not expired, OR
 *   b) An active paid subscription that has not expired
 */
userSchema.virtual('isPremiumActive').get(function () {
  const now = new Date();

  // Active trial
  if (this.plan === 'trial' && this.trial_end_date && this.trial_end_date > now) {
    return true;
  }

  // Active paid subscription
  if (
    this.subscription_status === 'active' &&
    this.subscription_end &&
    this.subscription_end > now
  ) {
    return true;
  }

  // Legacy: plan was directly set to 'premium' (backward compat)
  if (this.plan === 'premium' && this.subscription_status === 'active') {
    return true;
  }

  return false;
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
