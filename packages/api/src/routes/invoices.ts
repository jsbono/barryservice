import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { generateInvoicePDF, InvoiceData } from '../services/invoice-generator.js';

const router = Router();

// Validation schemas
const invoiceSchema = z.object({
  service_record_id: z.string().uuid('Invalid service record ID'),
  customer_id: z.string().uuid('Invalid customer ID'),
  invoice_number: z.string().max(50).optional(),
  due_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  subtotal: z.coerce.number().nonnegative(),
  tax_rate: z.coerce.number().min(0).max(1).default(0),
  tax_amount: z.coerce.number().nonnegative().optional(),
  discount_amount: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  payment_method: z.string().max(50).optional().nullable(),
  payment_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const invoiceUpdateSchema = invoiceSchema.partial().omit({ service_record_id: true, customer_id: true });

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customer_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  sort_by: z.enum(['created_at', 'due_date', 'total', 'invoice_number']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(supabase: NonNullable<Request['supabase']>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Get the last invoice number for this year
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    throw ApiError.internal(error.message);
  }

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].invoice_number.replace(prefix, ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

/**
 * GET /invoices - List all invoices with pagination and filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, customer_id, status, from_date, to_date, sort_by, sort_order } =
    querySchema.parse(req.query);
  const offset = (page - 1) * limit;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email),
      service_record:service_records(
        id, service_type, service_date,
        vehicle:vehicles(make, model, year, license_plate)
      )
    `, { count: 'exact' });

  // Apply filters
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (from_date) {
    query = query.gte('created_at', from_date);
  }
  if (to_date) {
    query = query.lte('created_at', to_date);
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: invoices, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({
    data: invoices,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}));

/**
 * GET /invoices/:id - Get a single invoice by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: invoice, error } = await req.supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      service_record:service_records(
        *,
        vehicle:vehicles(*),
        parts:service_parts(
          quantity, unit_price,
          part:parts(name, part_number)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Invoice');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: invoice });
}));

/**
 * POST /invoices - Create a new invoice
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = invoiceSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Generate invoice number if not provided
  const invoiceNumber = validatedData.invoice_number || await generateInvoiceNumber(req.supabase);

  // Calculate tax if not provided
  const taxAmount = validatedData.tax_amount ?? (validatedData.subtotal * validatedData.tax_rate);

  const { data: invoice, error } = await req.supabase
    .from('invoices')
    .insert({
      ...validatedData,
      invoice_number: invoiceNumber,
      tax_amount: taxAmount,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw ApiError.conflict('An invoice with this number already exists');
    }
    throw ApiError.internal(error.message);
  }

  res.status(201).json({ data: invoice });
}));

/**
 * POST /invoices/from-service/:serviceId - Create invoice from service record
 */
router.post('/from-service/:serviceId', asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const { tax_rate = 0, notes } = z.object({
    tax_rate: z.coerce.number().min(0).max(1).default(0),
    notes: z.string().max(2000).optional(),
  }).parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get service record with vehicle and customer
  const { data: service, error: serviceError } = await req.supabase
    .from('service_records')
    .select(`
      *,
      vehicle:vehicles(
        customer_id,
        customer:customers(id)
      ),
      parts:service_parts(quantity, unit_price)
    `)
    .eq('id', serviceId)
    .single();

  if (serviceError) {
    if (serviceError.code === 'PGRST116') {
      throw ApiError.notFound('Service record');
    }
    throw ApiError.internal(serviceError.message);
  }

  const customerId = service.vehicle?.customer?.id;
  if (!customerId) {
    throw ApiError.badRequest('Could not determine customer for this service');
  }

  // Calculate totals
  const laborCost = (service.labor_hours || 0) * (service.labor_rate || 0);
  const partsCost = service.parts?.reduce((sum: number, p: { quantity: number; unit_price: number }) =>
    sum + (p.quantity * p.unit_price), 0) || service.parts_cost || 0;
  const subtotal = laborCost + partsCost;
  const taxAmount = subtotal * tax_rate;
  const total = subtotal + taxAmount;

  // Generate invoice
  const invoiceNumber = await generateInvoiceNumber(req.supabase);

  const { data: invoice, error } = await req.supabase
    .from('invoices')
    .insert({
      service_record_id: serviceId,
      customer_id: customerId,
      invoice_number: invoiceNumber,
      subtotal,
      tax_rate,
      tax_amount: taxAmount,
      discount_amount: 0,
      total,
      status: 'draft',
      notes,
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.status(201).json({ data: invoice });
}));

/**
 * PUT /invoices/:id - Update an invoice
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = invoiceUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Recalculate tax and total if relevant fields changed
  const updateData = { ...validatedData, updated_at: new Date().toISOString() };
  if (validatedData.subtotal !== undefined || validatedData.tax_rate !== undefined) {
    // Get current values
    const { data: current } = await req.supabase
      .from('invoices')
      .select('subtotal, tax_rate, discount_amount')
      .eq('id', id)
      .single();

    if (current) {
      const subtotal = validatedData.subtotal ?? current.subtotal;
      const taxRate = validatedData.tax_rate ?? current.tax_rate;
      const discount = validatedData.discount_amount ?? current.discount_amount;

      updateData.tax_amount = subtotal * taxRate;
      updateData.total = subtotal + updateData.tax_amount - discount;
    }
  }

  const { data: invoice, error } = await req.supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Invoice');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: invoice });
}));

/**
 * PATCH /invoices/:id/status - Update invoice status
 */
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, payment_method, payment_date } = z.object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
    payment_method: z.string().max(50).optional(),
    payment_date: z.string().optional(),
  }).parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  interface InvoiceUpdateData {
    status: string;
    updated_at: string;
    payment_method?: string;
    payment_date?: string;
  }

  const updateData: InvoiceUpdateData = {
    status,
    updated_at: new Date().toISOString(),
  };

  // If marking as paid, record payment info
  if (status === 'paid') {
    updateData.payment_method = payment_method || 'other';
    updateData.payment_date = payment_date || new Date().toISOString();
  }

  const { data: invoice, error } = await req.supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Invoice');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: invoice });
}));

/**
 * DELETE /invoices/:id - Delete an invoice
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Only allow deleting draft invoices
  const { data: existing, error: fetchError } = await req.supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiError.notFound('Invoice');
    }
    throw ApiError.internal(fetchError.message);
  }

  if (existing.status !== 'draft') {
    throw ApiError.badRequest('Only draft invoices can be deleted');
  }

  const { error } = await req.supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.status(204).send();
}));

/**
 * GET /invoices/:id/pdf - Generate PDF for an invoice
 */
router.get('/:id/pdf', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get full invoice data
  const { data: invoice, error } = await req.supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      service_record:service_records(
        *,
        vehicle:vehicles(*),
        parts:service_parts(
          quantity, unit_price,
          part:parts(name, part_number)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Invoice');
    }
    throw ApiError.internal(error.message);
  }

  // Prepare invoice data for PDF generation
  const invoiceData: InvoiceData = {
    invoice_number: invoice.invoice_number,
    created_at: invoice.created_at,
    due_date: invoice.due_date,
    status: invoice.status,
    customer: {
      first_name: invoice.customer.first_name,
      last_name: invoice.customer.last_name,
      email: invoice.customer.email,
      phone: invoice.customer.phone,
      address: invoice.customer.address,
      city: invoice.customer.city,
      state: invoice.customer.state,
      zip_code: invoice.customer.zip_code,
    },
    vehicle: invoice.service_record?.vehicle ? {
      make: invoice.service_record.vehicle.make,
      model: invoice.service_record.vehicle.model,
      year: invoice.service_record.vehicle.year,
      license_plate: invoice.service_record.vehicle.license_plate,
      vin: invoice.service_record.vehicle.vin,
    } : undefined,
    service: invoice.service_record ? {
      service_type: invoice.service_record.service_type,
      description: invoice.service_record.description,
      service_date: invoice.service_record.service_date,
      labor_hours: invoice.service_record.labor_hours,
      labor_rate: invoice.service_record.labor_rate,
    } : undefined,
    parts: invoice.service_record?.parts?.map((p: { part: { name: string; part_number: string }; quantity: number; unit_price: number }) => ({
      name: p.part.name,
      part_number: p.part.part_number,
      quantity: p.quantity,
      unit_price: p.unit_price,
    })) || [],
    subtotal: invoice.subtotal,
    tax_rate: invoice.tax_rate,
    tax_amount: invoice.tax_amount,
    discount_amount: invoice.discount_amount,
    total: invoice.total,
    notes: invoice.notes,
    payment_method: invoice.payment_method,
    payment_date: invoice.payment_date,
  };

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoiceData);

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
}));

/**
 * GET /invoices/summary/stats - Get invoice statistics
 */
router.get('/summary/stats', asyncHandler(async (req: Request, res: Response) => {
  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get counts by status
  const { data: statusCounts, error: statusError } = await req.supabase
    .from('invoices')
    .select('status, total')
    .order('status');

  if (statusError) {
    throw ApiError.internal(statusError.message);
  }

  // Aggregate stats
  const stats = {
    total_invoices: statusCounts?.length || 0,
    by_status: {} as Record<string, { count: number; total: number }>,
    total_revenue: 0,
    total_outstanding: 0,
  };

  statusCounts?.forEach(inv => {
    if (!stats.by_status[inv.status]) {
      stats.by_status[inv.status] = { count: 0, total: 0 };
    }
    stats.by_status[inv.status].count++;
    stats.by_status[inv.status].total += inv.total || 0;

    if (inv.status === 'paid') {
      stats.total_revenue += inv.total || 0;
    } else if (inv.status === 'sent' || inv.status === 'overdue') {
      stats.total_outstanding += inv.total || 0;
    }
  });

  res.json({ data: stats });
}));

export default router;
