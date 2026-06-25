/**
 * subscriptionController.js
 * 
 * Handles:
 *   - Free trial claiming (POST /api/subscription/trial/claim)
 *   - Subscription status   (GET  /api/subscription/status)
 *   - Razorpay order create (POST /api/subscription/payment/create-order)
 *   - Razorpay verify       (POST /api/subscription/payment/verify)
 *   - Payment history       (GET  /api/subscription/payment/history)
 *   - Cancel subscription   (POST /api/subscription/cancel)
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import TrialTracking from '../models/TrialTracking.js';

// ── Razorpay lazy instance (avoids ES module import-order / dotenv timing bug) ─
let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
}

// ── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = {
  monthly: {
    label: 'Monthly Premium',
    amount_paise: 29900,   // ₹299
    amount_inr: 299,
    duration_days: 30
  },
  yearly: {
    label: 'Yearly Premium',
    amount_paise: 286900,  // ₹2869
    amount_inr: 2869,
    duration_days: 365
  }
};

// ── Helper ───────────────────────────────────────────────────────────────────
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/subscription/status
 * Returns the authenticated user's full subscription state.
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();

    // Auto-expire trial
    if (user.plan === 'trial' && user.trial_end_date && user.trial_end_date <= now) {
      user.plan = 'free';
      await user.save();
    }

    // Auto-expire subscription
    if (user.subscription_status === 'active' && user.subscription_end && user.subscription_end <= now) {
      user.subscription_status = 'expired';
      if (user.plan === 'premium') user.plan = 'free';
      await user.save();
    }

    const trialDaysRemaining = user.trial_end_date
      ? Math.max(0, Math.ceil((new Date(user.trial_end_date) - now) / (1000 * 60 * 60 * 24)))
      : 0;

    const subscriptionDaysRemaining = user.subscription_end
      ? Math.max(0, Math.ceil((new Date(user.subscription_end) - now) / (1000 * 60 * 60 * 24)))
      : 0;

    return res.json({
      plan: user.plan,
      isPremiumActive: user.isPremiumActive,
      trialAvailable: !user.trial_claimed,
      trial_claimed: user.trial_claimed,
      trial_start_date: user.trial_start_date,
      trial_end_date: user.trial_end_date,
      trial_days_remaining: trialDaysRemaining,
      subscription_type: user.subscription_type,
      subscription_status: user.subscription_status,
      subscription_start: user.subscription_start,
      subscription_end: user.subscription_end,
      subscription_days_remaining: subscriptionDaysRemaining
    });
  } catch (error) {
    console.error('[getSubscriptionStatus]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/subscription/trial/claim
 * Body: { email, phone }
 * Claims the 7-day free trial. Validates uniqueness of email + phone.
 */
export const claimTrial = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user._id;

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ message: 'A valid phone number is required to claim the trial.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Already claimed
    if (user.trial_claimed) {
      return res.status(400).json({ message: 'You have already claimed your free trial.' });
    }

    // Check permanent trial tracking — email
    const emailUsed = await TrialTracking.findOne({ email: user.email });
    if (emailUsed) {
      return res.status(409).json({
        message: 'This email address has already been used for a free trial.',
        field: 'email'
      });
    }

    // Check permanent trial tracking — phone
    const phoneUsed = await TrialTracking.findOne({ phone: phone.trim() });
    if (phoneUsed) {
      return res.status(409).json({
        message: 'This phone number has already been used for a free trial.',
        field: 'phone'
      });
    }

    // Activate trial
    const trialStart = new Date();
    const trialEnd = addDays(trialStart, 7);

    user.phone = phone.trim();
    user.plan = 'trial';
    user.trial_claimed = true;
    user.trial_start_date = trialStart;
    user.trial_end_date = trialEnd;
    await user.save();

    // Record in permanent tracking table (prevents future abuse)
    await TrialTracking.create({
      email: user.email,
      phone: phone.trim(),
      user_id: user._id,
      claimed_at: trialStart,
      trial_end_date: trialEnd
    });

    return res.status(201).json({
      message: '🎉 Your 7-day free trial has been activated!',
      trial_end_date: trialEnd,
      isPremiumActive: true
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = error.keyPattern?.email ? 'email' : 'phone';
      return res.status(409).json({
        message: `This ${field} has already been used for a free trial.`,
        field
      });
    }
    console.error('[claimTrial]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/subscription/payment/create-order
 * Body: { plan_type: 'monthly' | 'yearly' }
 * Creates a Razorpay order and returns order details to the frontend.
 */
export const createOrder = async (req, res) => {
  try {
    const { plan_type } = req.body;

    if (!plan_type || !PLANS[plan_type]) {
      return res.status(400).json({ message: 'Invalid plan type. Choose "monthly" or "yearly".' });
    }

    const plan = PLANS[plan_type];

    if (plan.amount_paise < 100) {
      return res.status(400).json({ message: 'Amount must be at least ₹1 (100 paise).' });
    }

    // Razorpay receipt must be ≤ 40 chars
    const shortId = req.user._id.toString().slice(-8);
    const shortTs = Date.now().toString().slice(-8);
    const receipt = `resq_${plan_type[0]}_${shortId}_${shortTs}`;

    const order = await getRazorpay().orders.create({
      amount: plan.amount_paise,
      currency: 'INR',
      receipt,
      notes: {
        user_id: req.user._id.toString(),
        plan_type,
        user_email: req.user.email
      }
    });

    // Save pending payment record
    await Payment.create({
      user_id: req.user._id,
      razorpay_order_id: order.id,
      amount: plan.amount_paise,
      currency: 'INR',
      plan_type,
      payment_status: 'created'
    });

    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan_type,
      plan_label: plan.label,
      amount_inr: plan.amount_inr
    });
  } catch (error) {
    console.error('[createOrder] ERROR:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
      description: error.error?.description,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0, 15) + '...' : 'MISSING'
    });
    const errMsg = error.error?.description || error.message || 'Unknown error';
    res.status(500).json({ message: `Payment order failed: ${errMsg}` });
  }
};

/**
 * POST /api/subscription/payment/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type }
 * Verifies HMAC-SHA256 signature, activates subscription on match.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_type) {
      return res.status(400).json({ message: 'Missing required payment verification fields.' });
    }

    // ── HMAC-SHA256 Signature Verification ───────────────────────────────────
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('[verifyPayment] Signature mismatch for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Do not activate subscription.'
      });
    }

    // ── Signature matched — activate subscription ─────────────────────────────
    const plan = PLANS[plan_type];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan type in verification.' });
    }

    const now = new Date();
    const subscriptionEnd = addDays(now, plan.duration_days);

    // Update payment record
    const paymentRecord = await Payment.findOneAndUpdate(
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        payment_status: 'paid',
        subscription_start: now,
        subscription_end: subscriptionEnd
      },
      { new: true }
    );

    if (!paymentRecord) {
      console.error('[verifyPayment] Payment record not found for order:', razorpay_order_id);
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    // Update user subscription
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        plan: 'premium',
        subscription_type: plan_type,
        subscription_status: 'active',
        subscription_start: now,
        subscription_end: subscriptionEnd,
        last_payment_id: paymentRecord._id
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: `🎉 Payment successful! Your ${plan.label} is now active.`,
      subscription_end: subscriptionEnd,
      plan_type,
      isPremiumActive: user.isPremiumActive
    });
  } catch (error) {
    console.error('[verifyPayment] Error:', error);
    res.status(500).json({ message: 'Payment verification failed. Contact support.' });
  }
};

/**
 * GET /api/subscription/payment/history
 * Returns the authenticated user's payment history.
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    const formatted = payments.map(p => ({
      id: p._id,
      razorpay_order_id: p.razorpay_order_id,
      razorpay_payment_id: p.razorpay_payment_id,
      amount_inr: (p.amount / 100).toFixed(2),
      amount_paise: p.amount,
      currency: p.currency,
      plan_type: p.plan_type,
      payment_status: p.payment_status,
      subscription_start: p.subscription_start,
      subscription_end: p.subscription_end,
      created_at: p.created_at
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('[getPaymentHistory]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/subscription/cancel
 * Marks the subscription as cancelled — access continues until subscription_end.
 */
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.subscription_status !== 'active') {
      return res.status(400).json({ message: 'No active subscription to cancel.' });
    }

    user.subscription_status = 'cancelled';
    await user.save();

    return res.json({
      message: 'Subscription cancelled. You retain access until ' + user.subscription_end?.toDateString() + '.',
      subscription_end: user.subscription_end
    });
  } catch (error) {
    console.error('[cancelSubscription]', error);
    res.status(500).json({ message: error.message });
  }
};
