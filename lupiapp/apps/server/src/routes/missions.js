import express from 'express';
import {
  getAvailableMissions,
  updateMissionProgress,
  getDailyMissions,
  getCompletedMissions
} from '../controllers/missions.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getAvailableMissions);
router.get('/daily', authenticateUser, getDailyMissions);
router.get('/completed', authenticateUser, getCompletedMissions);
router.post('/progress', authenticateUser, updateMissionProgress);

export default router;