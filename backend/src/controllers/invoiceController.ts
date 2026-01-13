import { Request, Response } from 'express';
import * as InvoiceModel from '../models/Invoice.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as VehicleModel from '../models/Vehicle.js';
import * as CustomerModel from '../models/Customer.js';
import {
  UpdateInvoiceRequest,
  ServiceRecordForInvoice,
  InvoiceStatus,
} from '../models/types.js';
import {
  generateInvoiceFromServiceRecord,
  regeneratePdf,
  getPdfBuffer,
  emailInvoiceToCustomer,
} from '../services/invoiceGenerator.js';

/**
 * List invoices with filtering
 * GET /api/invoices
 */
export function list(req: Request, res: Response): void {
  try {
    const status = req.query.status as InvoiceStatus | undefined;
    const customerId = req.query.customer_id as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const invoices = InvoiceModel.findAll(
      { status, customer_id: customerId, start_date: startDate, end_date: endDate },
      limit,
      offset
    );
    const total = InvoiceModel.count({ status, customer_id: customerId });

    // Get customer info for each invoice
    const invoicesWithCustomer = invoices.map((invoice) => {
      const customer = CustomerModel.findById(invoice.customer_id);
      const vehicle = invoice.vehicle_id ? VehicleModel.findById(invoice.vehicle_id) : null;
      return {
        ...invoice,
        customer: customer || undefined,
        vehicle: vehicle || undefined,
      };
    });

    res.json({ invoices: invoicesWithCustomer, total, limit, offset });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get single invoice by ID
 * GET /api/invoices/:id
 */
export function getById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const invoice = InvoiceModel.findByIdWithDetails(id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create invoice from service record
 * POST /api/invoices
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as ServiceRecordForInvoice;

    // Validate required fields
    if (!data.service_log_id) {
      res.status(400).json({ error: 'service_log_id is required' });
      return;
    }

    if (data.labor_hours === undefined || data.labor_hours < 0) {
      res.status(400).json({ error: 'labor_hours must be a non-negative number' });
      return;
    }

    if (!data.hourly_rate || data.hourly_rate <= 0) {
      res.status(400).json({ error: 'hourly_rate must be a positive number' });
      return;
    }

    // Verify service log exists
    const serviceLog = ServiceLogModel.findById(data.service_log_id);
    if (!serviceLog) {
      res.status(400).json({ error: 'Service log not found' });
      return;
    }

    // Check if invoice already exists for this service log
    const existingInvoice = InvoiceModel.findByServiceLogId(data.service_log_id);
    if (existingInvoice) {
      res.status(400).json({
        error: 'Invoice already exists for this service record',
        existing_invoice_id: existingInvoice.id,
        existing_invoice_number: existingInvoice.invoice_number,
      });
      return;
    }

    // Validate parts array if provided
    if (data.parts && !Array.isArray(data.parts)) {
      res.status(400).json({ error: 'parts must be an array' });
      return;
    }

    // Generate invoice
    const result = await generateInvoiceFromServiceRecord({
      ...data,
      parts: data.parts || [],
    });

    // Get full invoice details
    const invoice = InvoiceModel.findByIdWithDetails(result.invoice.id);

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    if (error.message.includes('not found')) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Update invoice (status, notes)
 * PUT /api/invoices/:id
 */
export function update(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const data = req.body as UpdateInvoiceRequest;

    const existing = InvoiceModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      if (!validStatuses.includes(data.status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }
    }

    const invoice = InvoiceModel.update(id, data);
    const invoiceWithDetails = InvoiceModel.findByIdWithDetails(id);

    res.json(invoiceWithDetails);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Download invoice PDF
 * GET /api/invoices/:id/pdf
 */
export async function downloadPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = InvoiceModel.findById(id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Regenerate PDF if not present
    let pdfBase64 = invoice.pdf_data;
    if (!pdfBase64) {
      try {
        pdfBase64 = await regeneratePdf(id);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        res.status(500).json({ error: 'Failed to generate PDF' });
        return;
      }
    }

    const pdfBuffer = getPdfBuffer(pdfBase64);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.invoice_number}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Email invoice to customer
 * POST /api/invoices/:id/send
 */
export async function sendInvoice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const invoice = InvoiceModel.findById(id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const success = await emailInvoiceToCustomer(id);

    if (success) {
      const updatedInvoice = InvoiceModel.findByIdWithDetails(id);
      res.json({
        message: 'Invoice sent successfully',
        invoice: updatedInvoice,
      });
    } else {
      res.status(500).json({
        error: 'Failed to send invoice. Check SMTP configuration.',
      });
    }
  } catch (error: any) {
    console.error('Send invoice error:', error);
    if (error.message.includes('no email')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Mark invoice as paid
 * POST /api/invoices/:id/mark-paid
 */
export function markAsPaid(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const invoice = InvoiceModel.findById(id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (invoice.status === 'paid') {
      res.status(400).json({ error: 'Invoice is already marked as paid' });
      return;
    }

    if (invoice.status === 'cancelled') {
      res.status(400).json({ error: 'Cannot mark a cancelled invoice as paid' });
      return;
    }

    InvoiceModel.markAsPaid(id);
    const updatedInvoice = InvoiceModel.findByIdWithDetails(id);

    res.json({
      message: 'Invoice marked as paid',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get invoice statistics
 * GET /api/invoices/stats
 */
export function getStats(req: Request, res: Response): void {
  try {
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;

    const totalRevenue = InvoiceModel.getTotalRevenue(startDate, endDate);
    const overdueInvoices = InvoiceModel.getOverdueInvoices();

    const stats = {
      total_invoices: InvoiceModel.count(),
      draft_count: InvoiceModel.count({ status: 'draft' }),
      sent_count: InvoiceModel.count({ status: 'sent' }),
      paid_count: InvoiceModel.count({ status: 'paid' }),
      overdue_count: overdueInvoices.length,
      cancelled_count: InvoiceModel.count({ status: 'cancelled' }),
      total_revenue: totalRevenue,
      overdue_invoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total: inv.total,
        due_date: inv.due_date,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create quick invoice from services with preset pricing
 * POST /api/invoices/quick
 */
export async function createQuick(req: Request, res: Response): Promise<void> {
  try {
    const { customer_id, vehicle_id, services, notes, tax_rate = 0.0825, status = 'sent' } = req.body;

    // Validate required fields
    if (!customer_id) {
      res.status(400).json({ error: 'customer_id is required' });
      return;
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      res.status(400).json({ error: 'services array is required with at least one service' });
      return;
    }

    // Verify customer exists
    const customer = CustomerModel.findById(customer_id);
    if (!customer) {
      res.status(400).json({ error: 'Customer not found' });
      return;
    }

    // Verify vehicle if provided
    if (vehicle_id) {
      const vehicle = VehicleModel.findById(vehicle_id);
      if (!vehicle) {
        res.status(400).json({ error: 'Vehicle not found' });
        return;
      }
    }

    // Build line items from services
    const line_items: Array<{
      line_type: 'labor' | 'part';
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      labor_hours?: number;
    }> = [];

    let subtotal = 0;

    for (const service of services) {
      const { name, price, quantity = 1, labor_hours = 1 } = service;

      if (!name || price === undefined) {
        res.status(400).json({ error: 'Each service must have a name and price' });
        return;
      }

      const totalPrice = price * quantity;
      subtotal += totalPrice;

      line_items.push({
        line_type: 'labor',
        description: name,
        quantity,
        unit_price: price,
        total_price: totalPrice,
        labor_hours,
      });
    }

    const taxAmount = subtotal * tax_rate;
    const total = subtotal + taxAmount;

    // Validate status if provided
    const validStatuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    // Create the invoice
    const invoice = InvoiceModel.create({
      customer_id,
      vehicle_id: vehicle_id || undefined,
      line_items,
      subtotal,
      tax_rate,
      tax_amount: taxAmount,
      total,
      notes: notes || undefined,
      status: status || 'draft',
    });

    // Generate PDF
    try {
      await regeneratePdf(invoice.id);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Continue even if PDF generation fails
    }

    // Get full invoice details
    const invoiceWithDetails = InvoiceModel.findByIdWithDetails(invoice.id);

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: invoiceWithDetails,
    });
  } catch (error: any) {
    console.error('Create quick invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete invoice
 * DELETE /api/invoices/:id
 */
export function remove(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const invoice = InvoiceModel.findById(id);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Only allow deleting draft invoices
    if (invoice.status !== 'draft') {
      res.status(400).json({
        error: 'Only draft invoices can be deleted. Consider cancelling instead.',
      });
      return;
    }

    const deleted = InvoiceModel.remove(id);

    if (deleted) {
      res.json({ message: 'Invoice deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
