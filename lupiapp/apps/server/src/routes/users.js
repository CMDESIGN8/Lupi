import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  updatePlayerPosition,
  getOnlinePlayers
} from '../controllers/users.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);
router.get('/stats', authenticateUser, getUserStats);
router.post('/position', authenticateUser, updatePlayerPosition);
router.get('/online', optionalAuth, getOnlinePlayers);

export default router;