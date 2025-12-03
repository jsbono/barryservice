import { Router } from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', serviceController.list);
router.get('/upcoming', serviceController.getUpcoming);
router.get('/recent', serviceController.getRecentActivity);
router.get('/expected', serviceController.getExpected);
router.get('/:id', serviceController.getById);
router.post('/', serviceController.create);
router.put('/:id', serviceController.update);

export default router;
