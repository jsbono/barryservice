import { Router } from 'express';
import * as lookupController from '../controllers/lookupController.js';

const router = Router();

// Public routes - no auth required
router.get('/makes', lookupController.getMakes);
router.get('/models', lookupController.getModels);
router.get('/years', lookupController.getYears);
router.get('/services', lookupController.getServices);

export default router;
