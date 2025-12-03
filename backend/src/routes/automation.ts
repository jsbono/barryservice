import { Router } from 'express';
import * as automationController from '../controllers/automationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/trigger', automationController.triggerReminders);

export default router;
