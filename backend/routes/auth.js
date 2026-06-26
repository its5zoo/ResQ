import express from 'express';
import { body } from 'express-validator';
import { registerUser, authUser, getUserProfile, refreshUserToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .custom((value) => {
        const emailStr = String(value).trim().toLowerCase();
        if (!emailStr.endsWith('@gmail.com')) {
          throw new Error('Only valid @gmail.com email addresses are allowed');
        }
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(emailStr)) {
          throw new Error('Please provide a valid @gmail.com email address');
        }
        return true;
      }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validateRequest
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email')
      .custom((value) => {
        const emailStr = String(value).trim().toLowerCase();
        if (!emailStr.endsWith('@gmail.com')) {
          throw new Error('Only valid @gmail.com email addresses are allowed');
        }
        return true;
      }),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  authUser
);

router.post('/refresh', refreshUserToken);

router.get('/me', protect, getUserProfile);

export default router;
