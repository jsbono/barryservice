import { Router } from 'express';
import * as partsController from '../controllers/partsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All parts routes require authentication
router.use(authMiddleware);

// GET /api/parts - List all parts with optional search
// Query params: search, limit, offset
router.get('/', partsController.list);

// GET /api/parts/low-stock - Get parts below reorder threshold
router.get('/low-stock', partsController.getLowStock);

// GET /api/parts/:id - Get single part
router.get('/:id', partsController.getById);

// POST /api/parts - Create new part
// Body: { sku, name, description?, cost, retail_price, quantity_in_stock?, reorder_threshold? }
router.post('/', partsController.create);

// PUT /api/parts/:id - Update part
// Body: partial Part fields
router.put('/:id', partsController.update);

// DELETE /api/parts/:id - Soft delete part
router.delete('/:id', partsController.remove);

// POST /api/parts/:id/adjust-stock - Adjust stock quantity
// Body: { quantity: number } (positive to add, negative to remove)
router.post('/:id/adjust-stock', partsController.adjustStock);

export default router;
