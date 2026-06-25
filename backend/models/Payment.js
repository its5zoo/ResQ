import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Razorpay identifiers
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true
  },
  razorpay_payment_id: {
    type: String,
    default: null
  },
  razorpay_signature: {
    type: String,
    default: null
  },
  // Payment details
  amount: {
    type: Number,
    required: true   // stored in paise
  },
  currency: {
    type: String,
    default: 'INR'
  },
  payment_status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created'
  },
  payment_method: {
    type: String,
    default: 'razorpay'
  },
  plan_type: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  // Subscription period activated by this payment
  subscription_start: {
    type: Date,
    default: null
  },
  subscription_end: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
