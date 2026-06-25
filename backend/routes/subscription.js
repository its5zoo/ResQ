import express from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';
import {
  getSubscriptionStatus,
  claimTrial,
  createOrder,
  verifyPayment,
  getPaymentHistory,
  cancelSubscription
} from '../controllers/subscriptionController.js';

const router = express.Router();

// All subscription routes require authentication
router.use(protect);

// GET  /api/subscription/status
router.get('/status', getSubscriptionStatus);

// POST /api/subscription/trial/claim
router.post(
  '/trial/claim',
  [
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .isMobilePhone().withMessage('Please provide a valid phone number'),
    validateRequest
  ],
  claimTrial
);

// POST /api/subscription/payment/create-order  ← Razorpay order creation
router.post(
  '/payment/create-order',
  [
    body('plan_type')
      .isIn(['monthly', 'yearly']).withMessage('Plan type must be "monthly" or "yearly"'),
    validateRequest
  ],
  createOrder
);

// POST /api/subscription/payment/verify  ← Razorpay signature verification
router.post(
  '/payment/verify',
  [
    body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
    body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
    body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
    body('plan_type').isIn(['monthly', 'yearly']).withMessage('Invalid plan_type'),
    validateRequest
  ],
  verifyPayment
);

// GET  /api/subscription/payment/history
router.get('/payment/history', getPaymentHistory);

// POST /api/subscription/cancel
router.post('/cancel', cancelSubscription);

export default router;
