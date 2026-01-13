import { Router } from 'express';
import * as customerAuthController from '../controllers/customerAuthController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes (no auth required)
router.post('/auth/login', customerAuthController.login);

// Protected routes (customer auth required)
router.get('/me', authMiddleware, customerAuthController.getMe);
router.get('/me/vehicles', authMiddleware, customerAuthController.getMyVehicles);
router.get('/vehicle/:vehicleId', authMiddleware, customerAuthController.getVehicle);
router.get('/vehicle/:vehicleId/services', authMiddleware, customerAuthController.getVehicleServices);
router.get('/vehicle/:vehicleId/recommended', authMiddleware, customerAuthController.getVehicleRecommended);
router.get('/vehicle/:vehicleId/scheduled', authMiddleware, customerAuthController.getVehicleScheduled);

// Invoice routes for customer portal
router.get('/invoices', authMiddleware, customerAuthController.getMyInvoices);
router.get('/invoices/:invoiceId/pdf', authMiddleware, customerAuthController.getInvoicePdf);

export default router;
