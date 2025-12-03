import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import * as customerAuthController from '../controllers/customerAuthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', customerController.list);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);
router.post('/:id/set-password', customerAuthController.setCustomerPassword);

export default router;
