import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const taskSchema = new mongoose.Schema({
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
  urgency: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  category: {
    type: String,
    default: 'Work'
  },
  completed: {
    type: Boolean,
    default: false
  },
  subtasks: [subtaskSchema],
  estimatedMinutes: {
    type: Number,
    default: 30
  },
  dueDate: {
    type: Date,
    required: true
  },
  aiPriorityRank: {
    type: Number
  },
  aiReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
