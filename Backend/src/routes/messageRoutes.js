import { Router } from 'express';
import * as messageController from '../controllers/messageController.js';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { sendMessageSchema } from '../validators/messageValidator.js';
import { messageLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(protect);

router.post('/', messageLimiter, validate(sendMessageSchema), messageController.sendMessage);
router.get('/:conversationId', messageController.getMessages);

export default router;
