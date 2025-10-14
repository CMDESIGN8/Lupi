import express from 'express';
import users from './users.js';
import missions from './missions.js';
import shop from './shop.js';
import clubs from './clubs.js';

const router = express.Router();

router.use('/users', users);
router.use('/missions', missions);
router.use('/shop', shop);
router.use('/clubs', clubs);

export default router;