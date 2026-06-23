import rateLimit from 'express-rate-limit';

export const aiVoiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each user to 30 requests per minute
  keyGenerator: (req) => req.user?.id || req.user?._id?.toString() || req.ip,
  message: { message: 'Too many requests, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false }
});
