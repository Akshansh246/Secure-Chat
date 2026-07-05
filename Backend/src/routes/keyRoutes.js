import { Router } from 'express';
import * as keyController from '../controllers/keyController.js';
import protect from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/public', keyController.storePublicKey);
router.get('/:userId', keyController.getPublicKey);

export default router;
