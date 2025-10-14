import express from 'express';
import {
  getClubs,
  createClub,
  getClubDetails,
  joinClub,
  leaveClub,
  getClubMembers,
  createClubPost
} from '../controllers/clubs.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getClubs);
router.get('/:clubId', getClubDetails);
router.get('/:clubId/members', getClubMembers);
router.post('/', authenticateUser, createClub);
router.post('/:clubId/join', authenticateUser, joinClub);
router.post('/leave', authenticateUser, leaveClub);
router.post('/:clubId/posts', authenticateUser, createClubPost);

export default router;