import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All invoice routes require authentication
router.use(authMiddleware);

// GET /api/invoices - List invoices with filtering
// Query params: status, customer_id, start_date, end_date, limit, offset
router.get('/', invoiceController.list);

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', invoiceController.getStats);

// GET /api/invoices/:id - Get single invoice with details
router.get('/:id', invoiceController.getById);

// POST /api/invoices - Create invoice from service record
// Body: { service_log_id, labor_hours, hourly_rate, parts: [{part_id, quantity}], tax_rate?, notes?, payment_terms? }
router.post('/', invoiceController.create);

// POST /api/invoices/quick - Create quick invoice with services and preset pricing
// Body: { customer_id, vehicle_id?, services: [{name, price, quantity?, labor_hours?}], notes?, tax_rate? }
router.post('/quick', invoiceController.createQuick);

// PUT /api/invoices/:id - Update invoice (status, notes)
// Body: { status?, notes?, due_date? }
router.put('/:id', invoiceController.update);

// DELETE /api/invoices/:id - Delete draft invoice
router.delete('/:id', invoiceController.remove);

// GET /api/invoices/:id/pdf - Download invoice PDF
router.get('/:id/pdf', invoiceController.downloadPdf);

// POST /api/invoices/:id/send - Email invoice to customer
router.post('/:id/send', invoiceController.sendInvoice);

// POST /api/invoices/:id/mark-paid - Mark invoice as paid
router.post('/:id/mark-paid', invoiceController.markAsPaid);

export default router;
