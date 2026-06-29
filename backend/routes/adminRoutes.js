import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, getStats, getAllUsers, grantPremium, revokePremium } from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(isAdmin);

// GET  /api/admin/stats    — Aggregate dashboard stats
router.get('/stats', getStats);

// GET  /api/admin/users    — Paginated user list
// Query: ?page=1&limit=30&plan=free|trial|premium&search=<email>
router.get('/users', getAllUsers);

// POST /api/admin/users/:id/grant-premium
// Body: { duration_days: 30 }
router.post('/users/:id/grant-premium', grantPremium);

// POST /api/admin/users/:id/revoke-premium
router.post('/users/:id/revoke-premium', revokePremium);

export default router;
