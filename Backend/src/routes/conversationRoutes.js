import { Router } from 'express';
import * as conversationController from '../controllers/conversationController.js';
import protect from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createConversationSchema } from '../validators/conversationValidator.js';

const router = Router();

router.use(protect);

router.post('/', validate(createConversationSchema), conversationController.createConversation);
router.get('/', conversationController.getUserConversations);

export default router;
