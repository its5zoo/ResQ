import mongoose from 'mongoose';

/**
 * Permanent trial tracking collection.
 * Records are NEVER deleted — used to permanently prevent trial abuse.
 * One document per email, one document per phone (enforced by unique indexes).
 */
const trialTrackingSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimed_at: {
    type: Date,
    default: Date.now
  },
  trial_end_date: {
    type: Date,
    required: true
  }
}, {
  timestamps: false
});

const TrialTracking = mongoose.model('TrialTracking', trialTrackingSchema);
export default TrialTracking;
