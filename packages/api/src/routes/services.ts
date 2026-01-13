import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const serviceRecordSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  service_type: z.string().min(1, 'Service type is required').max(100),
  description: z.string().max(2000).optional().nullable(),
  service_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  mileage_at_service: z.coerce.number().int().nonnegative().optional().nullable(),
  labor_hours: z.coerce.number().nonnegative().optional().nullable(),
  labor_rate: z.coerce.number().nonnegative().optional().nullable(),
  parts_cost: z.coerce.number().nonnegative().optional().nullable(),
  total_cost: z.coerce.number().nonnegative().optional().nullable(),
  technician_name: z.string().max(100).optional().nullable(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('completed'),
  notes: z.string().max(2000).optional().nullable(),
  next_service_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  next_service_mileage: z.coerce.number().int().nonnegative().optional().nullable(),
});

const serviceRecordUpdateSchema = serviceRecordSchema.partial().omit({ vehicle_id: true });

const servicePartSchema = z.object({
  part_id: z.string().uuid('Invalid part ID'),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().nonnegative(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  vehicle_id: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  service_type: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  sort_by: z.enum(['service_date', 'created_at', 'total_cost']).default('service_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /services - List all service records with pagination and filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, vehicle_id, status, service_type, from_date, to_date, sort_by, sort_order } =
    querySchema.parse(req.query);
  const offset = (page - 1) * limit;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('service_records')
    .select(`
      *,
      vehicle:vehicles(
        id, make, model, year, license_plate,
        customer:customers(id, first_name, last_name)
      )
    `, { count: 'exact' });

  // Apply filters
  if (vehicle_id) {
    query = query.eq('vehicle_id', vehicle_id);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (service_type) {
    query = query.ilike('service_type', `%${service_type}%`);
  }
  if (from_date) {
    query = query.gte('service_date', from_date);
  }
  if (to_date) {
    query = query.lte('service_date', to_date);
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: services, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({
    data: services,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}));

/**
 * GET /services/:id - Get a single service record by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: service, error } = await req.supabase
    .from('service_records')
    .select(`
      *,
      vehicle:vehicles(
        id, make, model, year, license_plate, vin,
        customer:customers(id, first_name, last_name, email, phone)
      ),
      parts:service_parts(
        id,
        quantity,
        unit_price,
        part:parts(id, name, part_number, description)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Service record');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: service });
}));

/**
 * POST /services - Create a new service record
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = serviceRecordSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Verify vehicle exists
  const { data: vehicle, error: vehicleError } = await req.supabase
    .from('vehicles')
    .select('id, mileage')
    .eq('id', validatedData.vehicle_id)
    .single();

  if (vehicleError || !vehicle) {
    throw ApiError.badRequest('Vehicle not found');
  }

  // Calculate total cost if not provided
  let totalCost = validatedData.total_cost;
  if (!totalCost) {
    const laborCost = (validatedData.labor_hours || 0) * (validatedData.labor_rate || 0);
    totalCost = laborCost + (validatedData.parts_cost || 0);
  }

  const { data: service, error } = await req.supabase
    .from('service_records')
    .insert({
      ...validatedData,
      total_cost: totalCost,
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(error.message);
  }

  // Update vehicle mileage if service mileage is higher
  if (validatedData.mileage_at_service &&
      (!vehicle.mileage || validatedData.mileage_at_service > vehicle.mileage)) {
    await req.supabase
      .from('vehicles')
      .update({ mileage: validatedData.mileage_at_service })
      .eq('id', validatedData.vehicle_id);
  }

  res.status(201).json({ data: service });
}));

/**
 * PUT /services/:id - Update a service record
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = serviceRecordUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Recalculate total cost if relevant fields changed
  let updateData = { ...validatedData, updated_at: new Date().toISOString() };
  if (validatedData.labor_hours !== undefined ||
      validatedData.labor_rate !== undefined ||
      validatedData.parts_cost !== undefined) {
    const laborCost = (validatedData.labor_hours || 0) * (validatedData.labor_rate || 0);
    updateData.total_cost = laborCost + (validatedData.parts_cost || 0);
  }

  const { data: service, error } = await req.supabase
    .from('service_records')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Service record');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: service });
}));

/**
 * PATCH /services/:id - Partial update a service record
 */
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = serviceRecordUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: service, error } = await req.supabase
    .from('service_records')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Service record');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: service });
}));

/**
 * DELETE /services/:id - Delete a service record
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { error } = await req.supabase
    .from('service_records')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Service record');
    }
    throw ApiError.internal(error.message);
  }

  res.status(204).send();
}));

/**
 * POST /services/:id/parts - Add parts to a service record
 */
router.post('/:id/parts', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parts = z.array(servicePartSchema).parse(req.body.parts);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Verify service record exists
  const { error: serviceError } = await req.supabase
    .from('service_records')
    .select('id')
    .eq('id', id)
    .single();

  if (serviceError) {
    if (serviceError.code === 'PGRST116') {
      throw ApiError.notFound('Service record');
    }
    throw ApiError.internal(serviceError.message);
  }

  // Insert service parts
  const serviceParts = parts.map(part => ({
    service_record_id: id,
    part_id: part.part_id,
    quantity: part.quantity,
    unit_price: part.unit_price,
  }));

  const { data: insertedParts, error } = await req.supabase
    .from('service_parts')
    .insert(serviceParts)
    .select(`
      *,
      part:parts(name, part_number)
    `);

  if (error) {
    throw ApiError.internal(error.message);
  }

  // Update parts cost on service record
  const totalPartsCost = parts.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
  await req.supabase
    .from('service_records')
    .update({ parts_cost: totalPartsCost })
    .eq('id', id);

  res.status(201).json({ data: insertedParts });
}));

/**
 * GET /services/upcoming - Get upcoming scheduled services
 */
router.get('/upcoming/list', asyncHandler(async (req: Request, res: Response) => {
  const { limit } = z.object({
    limit: z.coerce.number().int().positive().max(50).default(10),
  }).parse(req.query);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: services, error } = await req.supabase
    .from('service_records')
    .select(`
      *,
      vehicle:vehicles(
        id, make, model, year, license_plate,
        customer:customers(id, first_name, last_name, phone, email)
      )
    `)
    .eq('status', 'scheduled')
    .gte('service_date', today)
    .order('service_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: services });
}));

/**
 * GET /services/types - Get distinct service types
 */
router.get('/types/list', asyncHandler(async (req: Request, res: Response) => {
  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data, error } = await req.supabase
    .from('service_records')
    .select('service_type')
    .order('service_type');

  if (error) {
    throw ApiError.internal(error.message);
  }

  // Get unique service types
  const uniqueTypes = [...new Set(data?.map(d => d.service_type) || [])];

  res.json({ data: uniqueTypes });
}));

export default router;
