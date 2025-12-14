import { Router } from 'express';
import * as insightsController from '../controllers/insightsController.js';

const router = Router();

// Agent routes
router.post('/run/:type', insightsController.runAgent);
router.get('/runs', insightsController.getAgentRuns);

export default router;
