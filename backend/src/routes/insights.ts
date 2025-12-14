import { Router } from 'express';
import * as insightsController from '../controllers/insightsController.js';

const router = Router();

// Insights routes
router.get('/', insightsController.list);
router.get('/stats', insightsController.getStats);
router.get('/:id', insightsController.getById);
router.put('/:id/read', insightsController.markRead);
router.put('/:id/action', insightsController.markActioned);
router.put('/:id/dismiss', insightsController.dismiss);

export default router;
