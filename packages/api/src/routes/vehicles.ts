import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { config } from '../config/index.js';

const router = Router();

// Validation schemas
const vehicleSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  vin: z.string().length(17, 'VIN must be exactly 17 characters').optional().nullable(),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2),
  license_plate: z.string().max(20).optional().nullable(),
  color: z.string().max(30).optional().nullable(),
  engine_type: z.string().max(50).optional().nullable(),
  transmission: z.enum(['automatic', 'manual', 'cvt', 'other']).optional().nullable(),
  mileage: z.coerce.number().int().nonnegative().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const vehicleUpdateSchema = vehicleSchema.partial().omit({ customer_id: true });

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  sort_by: z.enum(['make', 'model', 'year', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /vehicles - List all vehicles with pagination and search
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, customer_id, sort_by, sort_order } = querySchema.parse(req.query);
  const offset = (page - 1) * limit;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('vehicles')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone)
    `, { count: 'exact' });

  // Apply filters
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }

  if (search) {
    query = query.or(
      `make.ilike.%${search}%,model.ilike.%${search}%,license_plate.ilike.%${search}%,vin.ilike.%${search}%`
    );
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: vehicles, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({
    data: vehicles,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}));

/**
 * GET /vehicles/:id - Get a single vehicle by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: vehicle, error } = await req.supabase
    .from('vehicles')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone),
      service_records:service_records(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Vehicle');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: vehicle });
}));

/**
 * POST /vehicles - Create a new vehicle
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = vehicleSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Verify customer exists
  const { data: customer, error: customerError } = await req.supabase
    .from('customers')
    .select('id')
    .eq('id', validatedData.customer_id)
    .single();

  if (customerError || !customer) {
    throw ApiError.badRequest('Customer not found');
  }

  const { data: vehicle, error } = await req.supabase
    .from('vehicles')
    .insert(validatedData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw ApiError.conflict('A vehicle with this VIN already exists');
    }
    throw ApiError.internal(error.message);
  }

  res.status(201).json({ data: vehicle });
}));

/**
 * PUT /vehicles/:id - Update a vehicle
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = vehicleUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: vehicle, error } = await req.supabase
    .from('vehicles')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Vehicle');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: vehicle });
}));

/**
 * PATCH /vehicles/:id - Partial update a vehicle
 */
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = vehicleUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: vehicle, error } = await req.supabase
    .from('vehicles')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Vehicle');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: vehicle });
}));

/**
 * DELETE /vehicles/:id - Delete a vehicle
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { error } = await req.supabase
    .from('vehicles')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Vehicle');
    }
    throw ApiError.internal(error.message);
  }

  res.status(204).send();
}));

/**
 * GET /vehicles/:id/services - Get service history for a vehicle
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
      parts:service_parts(
        quantity,
        unit_price,
        part:parts(name, part_number)
      )
    `)
    .eq('vehicle_id', id)
    .order('service_date', { ascending: false });

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: services });
}));

/**
 * POST /vehicles/vin-lookup - Lookup vehicle info from VIN
 */
router.post('/vin-lookup', asyncHandler(async (req: Request, res: Response) => {
  const { vin } = z.object({
    vin: z.string().length(17, 'VIN must be exactly 17 characters'),
  }).parse(req.body);

  try {
    // Call NHTSA API to decode VIN
    const response = await fetch(
      `${config.nhtsa.apiUrl}/vehicles/decodevin/${vin}?format=json`
    );

    if (!response.ok) {
      throw ApiError.serviceUnavailable('VIN lookup service unavailable');
    }

    const data = await response.json() as {
      Results: Array<{ Variable: string; Value: string | null }>;
    };

    // Parse NHTSA response and extract relevant fields
    const results = data.Results || [];
    const getValue = (variableName: string): string | null => {
      const item = results.find((r) => r.Variable === variableName);
      return item?.Value || null;
    };

    const vehicleInfo = {
      vin,
      make: getValue('Make'),
      model: getValue('Model'),
      year: getValue('Model Year'),
      engine_type: getValue('Fuel Type - Primary'),
      transmission: getValue('Transmission Style'),
      body_class: getValue('Body Class'),
      drive_type: getValue('Drive Type'),
      displacement: getValue('Displacement (L)'),
      cylinders: getValue('Engine Number of Cylinders'),
      plant_city: getValue('Plant City'),
      plant_country: getValue('Plant Country'),
      error_code: getValue('Error Code'),
      error_text: getValue('Error Text'),
    };

    // Check for decode errors
    if (vehicleInfo.error_code && vehicleInfo.error_code !== '0') {
      res.json({
        data: vehicleInfo,
        warning: 'VIN may be invalid or incomplete',
      });
      return;
    }

    res.json({ data: vehicleInfo });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.serviceUnavailable('Failed to lookup VIN');
  }
}));

/**
 * PATCH /vehicles/:id/mileage - Update vehicle mileage
 */
router.patch('/:id/mileage', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mileage } = z.object({
    mileage: z.coerce.number().int().nonnegative(),
  }).parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get current mileage to ensure new value is higher
  const { data: existing, error: fetchError } = await req.supabase
    .from('vehicles')
    .select('mileage')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiError.notFound('Vehicle');
    }
    throw ApiError.internal(fetchError.message);
  }

  if (existing.mileage && mileage < existing.mileage) {
    throw ApiError.badRequest('New mileage cannot be less than current mileage');
  }

  const { data: vehicle, error } = await req.supabase
    .from('vehicles')
    .update({
      mileage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: vehicle });
}));

export default router;
