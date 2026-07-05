import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import protect from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/me', userController.getMe);
router.get('/search', userController.searchUsers);

export default router;
