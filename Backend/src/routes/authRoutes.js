import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

export default router;
