/**
 * adminController.js
 *
 * Admin-only endpoints for subscription and user tracking.
 * Protected by isAdmin middleware (only the account owner can access).
 */

import User from '../models/User.js';
import Payment from '../models/Payment.js';

// ── Helper ───────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'faisalkhan786@gmail.com'; // Owner's email

/** Middleware: Restrict to admin-only */
export function isAdmin(req, res, next) {
  if (!req.user || req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Admin access only.' });
  }
  next();
}

/**
 * GET /api/admin/stats
 * Returns aggregate subscription stats.
 */
export const getStats = async (req, res) => {
  try {
    const now = new Date();

    const [totalUsers, premiumUsers, trialUsers, freeUsers, totalRevenuePaid, recentPayments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ plan: 'premium', subscription_status: 'active', subscription_end: { $gt: now } }),
      User.countDocuments({ plan: 'trial', trial_end_date: { $gt: now } }),
      User.countDocuments({ plan: 'free' }),
      Payment.aggregate([
        { $match: { payment_status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.find({ payment_status: 'paid' })
        .sort({ created_at: -1 })
        .limit(10)
        .populate('user_id', 'name email')
        .lean()
    ]);

    const totalRevenue = totalRevenuePaid[0]?.total || 0;

    return res.json({
      stats: {
        totalUsers,
        premiumUsers,
        trialUsers,
        freeUsers,
        totalRevenue_paise: totalRevenue,
        totalRevenue_inr: (totalRevenue / 100).toFixed(2)
      },
      recentPayments: recentPayments.map(p => ({
        id: p._id,
        user: p.user_id ? { name: p.user_id.name, email: p.user_id.email } : null,
        amount_inr: (p.amount / 100).toFixed(2),
        plan_type: p.plan_type,
        status: p.payment_status,
        razorpay_payment_id: p.razorpay_payment_id,
        created_at: p.created_at
      }))
    });
  } catch (error) {
    console.error('[adminStats]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/admin/users
 * Returns paginated list of all users with plan and payment info.
 * Query params: ?page=1&limit=20&plan=free|trial|premium&search=email
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.plan && ['free', 'trial', 'premium'].includes(req.query.plan)) {
      filter.plan = req.query.plan;
    }
    if (req.query.search) {
      filter.$or = [
        { email: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email plan subscription_status subscription_start subscription_end trial_claimed trial_end_date voiceAI.monthlyCommandsUsed voiceAI.monthlyLimit voiceAI.enabled createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),
      User.countDocuments(filter)
    ]);

    return res.json({
      page,
      total,
      totalPages: Math.ceil(total / limit),
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        isPremiumActive: u.isPremiumActive,
        subscription_status: u.subscription_status,
        subscription_start: u.subscription_start,
        subscription_end: u.subscription_end,
        trial_claimed: u.trial_claimed,
        trial_end_date: u.trial_end_date,
        voiceCommandsUsed: u.voiceAI?.monthlyCommandsUsed || 0,
        voiceLimit: u.voiceAI?.monthlyLimit || 30,
        voiceEnabled: u.voiceAI?.enabled ?? true,
        joinedAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('[adminGetAllUsers]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/admin/users/:id/grant-premium
 * Manually grant premium to a user (e.g. for testing or comps).
 */
export const grantPremium = async (req, res) => {
  try {
    const { duration_days = 30 } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + parseInt(duration_days));

    user.plan = 'premium';
    user.subscription_status = 'active';
    user.subscription_start = now;
    user.subscription_end = end;
    user.subscription_type = 'monthly';
    // Reset voiceAI
    user.voiceAI = {
      ...user.voiceAI,
      enabled: true,
      disabledReason: null,
      monthlyCommandsUsed: 0,
      monthlyLimit: -1
    };
    user.markModified('voiceAI');
    await user.save();

    return res.json({
      success: true,
      message: `Premium granted to ${user.email} for ${duration_days} days.`,
      subscription_end: end
    });
  } catch (error) {
    console.error('[adminGrantPremium]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/admin/users/:id/revoke-premium
 * Revokes a user's premium and sets them back to free.
 */
export const revokePremium = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.plan = 'free';
    user.subscription_status = 'cancelled';
    user.voiceAI = {
      ...user.voiceAI,
      monthlyLimit: 30,
      monthlyCommandsUsed: 0
    };
    user.markModified('voiceAI');
    await user.save();

    return res.json({ success: true, message: `Premium revoked for ${user.email}.` });
  } catch (error) {
    console.error('[adminRevokePremium]', error);
    res.status(500).json({ message: error.message });
  }
};
