import User from '../models/User.js';

/**
 * Reusable helper to check and increment voice usage (used by express middleware and sockets)
 */
export async function checkAndIncrementVoiceUsage(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return { blocked: true, status: 404, message: 'User not found' };
  }

  // 0. Auto-heal: If user has active premium but voiceAI was disabled (e.g. old limit lock),
  //    re-enable it transparently so they don't need to re-login after purchasing.
  if (user.isPremiumActive && user.voiceAI && !user.voiceAI.enabled) {
    console.log(`[voiceGate] Auto-healing voiceAI for premium user ${userId}`);
    user.voiceAI.enabled = true;
    user.voiceAI.disabledReason = null;
    user.voiceAI.monthlyCommandsUsed = 0;
    user.voiceAI.monthlyLimit = -1; // unlimited
    await user.save();
  }

  // 1. Check if voice AI is enabled by user
  if (!user.voiceAI || !user.voiceAI.enabled) {
    const isLimit = user.voiceAI?.disabledReason === 'limit_reached';
    return {
      blocked: true,
      status: 403,
      reason: user.voiceAI?.disabledReason || 'user_disabled',
      message: isLimit
        ? 'Monthly voice AI limit reached. Upgrade to Premium for unlimited access.'
        : 'Voice AI is disabled. Enable it in Settings → Voice AI.'
    };
  }

  // 2. Premium users with unlimited limit (-1): skip all limit checks
  if (user.voiceAI.monthlyLimit === -1 || user.isPremiumActive) {
    // Still increment for analytics, but never block
    user.voiceAI.monthlyCommandsUsed = (user.voiceAI.monthlyCommandsUsed || 0) + 1;
    await user.save();
    return {
      blocked: false,
      user,
      voiceUsage: {
        used: user.voiceAI.monthlyCommandsUsed,
        limit: -1,
        remaining: -1 // unlimited
      }
    };
  }

  // 3. Reset counter if new month
  const now = new Date();
  const lastReset = new Date(user.voiceAI.lastResetDate || Date.now());
  if (now.getMonth() !== lastReset.getMonth() || 
      now.getFullYear() !== lastReset.getFullYear()) {
    user.voiceAI.monthlyCommandsUsed = 0;
    user.voiceAI.lastResetDate = now;
    user.voiceAI.disabledReason = null;
    await user.save();
  }

  // 4. Check limit
  if (user.voiceAI.monthlyCommandsUsed >= user.voiceAI.monthlyLimit) {
    // Auto-disable
    user.voiceAI.enabled = false;
    user.voiceAI.disabledReason = 'limit_reached';
    await user.save();

    return {
      blocked: true,
      status: 403,
      reason: 'limit_reached',
      used: user.voiceAI.monthlyCommandsUsed,
      limit: user.voiceAI.monthlyLimit,
      message: 'Monthly voice AI limit reached. Upgrade to Premium for unlimited access.'
    };
  }

  // 5. Increment counter and proceed
  user.voiceAI.monthlyCommandsUsed += 1;
  await user.save();

  return {
    blocked: false,
    user,
    voiceUsage: {
      used: user.voiceAI.monthlyCommandsUsed,
      limit: user.voiceAI.monthlyLimit,
      remaining: user.voiceAI.monthlyLimit - user.voiceAI.monthlyCommandsUsed
    }
  };
}

/**
 * Express middleware to gate voice and AI requests
 */
export async function voiceGate(req, res, next) {
  try {
    const userId = req.userId || req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no user context' });
    }

    const check = await checkAndIncrementVoiceUsage(userId);

    if (check.blocked) {
      if (process.env.BYPASS_VOICE_GATE === 'true') {
        console.warn('[voiceGate] BYPASS ACTIVE: Proceeding because BYPASS_VOICE_GATE is true in .env');
      } else {
        return res.status(check.status).json({
          blocked: true,
          reason: check.reason,
          used: check.used,
          limit: check.limit,
          message: check.message
        });
      }
    }

    // Attach usage info to request for response headers
    if (check.voiceUsage) {
      req.voiceUsage = check.voiceUsage;
      res.setHeader('X-Voice-AI-Used', check.voiceUsage.used);
      res.setHeader('X-Voice-AI-Limit', check.voiceUsage.limit);
      res.setHeader('X-Voice-AI-Remaining', check.voiceUsage.remaining);
    }

    next();
  } catch (error) {
    console.error('Error in voiceGate middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

