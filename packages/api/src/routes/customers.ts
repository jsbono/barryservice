import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const customerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip_code: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  preferred_contact_method: z.enum(['email', 'phone', 'sms']).optional().nullable(),
});

const customerUpdateSchema = customerSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sort_by: z.enum(['first_name', 'last_name', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /customers - List all customers with pagination and search
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, sort_by, sort_order } = querySchema.parse(req.query);
  const offset = (page - 1) * limit;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('customers')
    .select('*', { count: 'exact' });

  // Apply search filter
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: customers, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({
    data: customers,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}));

/**
 * GET /customers/:id - Get a single customer by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: customer, error } = await req.supabase
    .from('customers')
    .select(`
      *,
      vehicles:vehicles(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Customer');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: customer });
}));

/**
 * POST /customers - Create a new customer
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = customerSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: customer, error } = await req.supabase
    .from('customers')
    .insert(validatedData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw ApiError.conflict('A customer with this email already exists');
    }
    throw ApiError.internal(error.message);
  }

  res.status(201).json({ data: customer });
}));

/**
 * PUT /customers/:id - Update a customer
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = customerUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: customer, error } = await req.supabase
    .from('customers')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Customer');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: customer });
}));

/**
 * PATCH /customers/:id - Partial update a customer
 */
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = customerUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: customer, error } = await req.supabase
    .from('customers')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Customer');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: customer });
}));

/**
 * DELETE /customers/:id - Delete a customer
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { error } = await req.supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Customer');
    }
    throw ApiError.internal(error.message);
  }

  res.status(204).send();
}));

/**
 * GET /customers/:id/vehicles - Get all vehicles for a customer
 */
router.get('/:id/vehicles', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: vehicles, error } = await req.supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: vehicles });
}));

/**
 * GET /customers/:id/services - Get service history for a customer
 */
router.get('/:id/services', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: services, error } = await req.supabase
    .from('service_records')
    .select(`
      *,
      vehicle:vehicles(make, model, year, license_plate)
    `)
    .eq('vehicles.customer_id', id)
    .order('service_date', { ascending: false });

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: services });
}));

export default router;
