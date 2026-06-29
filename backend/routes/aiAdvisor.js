import express from 'express';
import { 
  getDailySummary, 
  askAdvisor, 
  getGlobalPriority,
  getForesightScan,
  getRescuePlan,
  getPreMortem,
  getProcrastinationIntercept,
  postMeetingIntelligence,
  getEnergySchedule
} from '../controllers/aiAdvisorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { voiceGate } from '../middleware/voiceGate.js';

const router = express.Router();

router.use(protect);

router.get('/daily-summary', voiceGate, getDailySummary);
router.post('/ask', voiceGate, askAdvisor);
router.get('/global-priority', voiceGate, getGlobalPriority);
router.get('/foresight-scan', voiceGate, getForesightScan);
router.post('/rescue-plan', voiceGate, getRescuePlan);
router.post('/pre-mortem', voiceGate, getPreMortem);
router.post('/procrastination-intercept', voiceGate, getProcrastinationIntercept);
router.post('/post-meeting', voiceGate, postMeetingIntelligence);
router.get('/energy-schedule', voiceGate, getEnergySchedule);
export default router;
