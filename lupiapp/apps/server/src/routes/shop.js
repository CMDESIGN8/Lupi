import express from 'express';
import {
  getAvatars,
  purchaseAvatar,
  equipAvatar,
  getUserAvatars,
  getShopItems
} from '../controllers/shop.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/avatars', optionalAuth, getAvatars);
router.get('/my-avatars', authenticateUser, getUserAvatars);
router.get('/items', authenticateUser, getShopItems);
router.post('/avatars/purchase', authenticateUser, purchaseAvatar);
router.post('/avatars/equip', authenticateUser, equipAvatar);

export default router;