import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  week: {
    type: Number,
    required: true
  },
  milestone: {
    type: String,
    required: true
  },
  effort: {
    type: String,
    default: 'medium'
  },
  done: {
    type: Boolean,
    default: false
  }
});

const keyResultSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  targetDate: {
    type: Date,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [milestoneSchema],
  keyResults: [keyResultSchema]
});

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
