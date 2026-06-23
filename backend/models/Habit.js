import mongoose from 'mongoose';

const habitCompletionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  targetDays: {
    type: [String],
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  completions: [habitCompletionSchema],
  streak: {
    type: Number,
    default: 0
  },
  aiInsight: {
    type: String,
    default: ''
  },
  aiTip: {
    type: String,
    default: ''
  }
});

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
