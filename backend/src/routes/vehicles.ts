import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', vehicleController.list);
router.get('/:id', vehicleController.getById);
router.post('/', vehicleController.create);
router.put('/:id', vehicleController.update);
router.delete('/:id', vehicleController.remove);

export default router;
