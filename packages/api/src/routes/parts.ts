import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const partSchema = z.object({
  part_number: z.string().min(1, 'Part number is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  unit_cost: z.coerce.number().nonnegative().optional().nullable(),
  retail_price: z.coerce.number().nonnegative().optional().nullable(),
  quantity_in_stock: z.coerce.number().int().nonnegative().default(0),
  reorder_level: z.coerce.number().int().nonnegative().default(0),
  location: z.string().max(100).optional().nullable(), // bin/shelf location
  compatible_makes: z.array(z.string()).optional().nullable(),
  compatible_models: z.array(z.string()).optional().nullable(),
  is_active: z.boolean().default(true),
});

const partUpdateSchema = partSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  low_stock: z.coerce.boolean().optional(),
  is_active: z.coerce.boolean().optional(),
  sort_by: z.enum(['name', 'part_number', 'category', 'quantity_in_stock', 'created_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().int(),
  reason: z.string().max(500).optional(),
  adjustment_type: z.enum(['add', 'remove', 'set']),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /parts - List all parts with pagination and search
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, category, manufacturer, low_stock, is_active, sort_by, sort_order } =
    querySchema.parse(req.query);
  const offset = (page - 1) * limit;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('parts')
    .select('*', { count: 'exact' });

  // Apply filters
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,part_number.ilike.%${search}%,description.ilike.%${search}%`
    );
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (manufacturer) {
    query = query.eq('manufacturer', manufacturer);
  }
  if (low_stock) {
    // Parts where quantity is at or below reorder level
    query = query.lte('quantity_in_stock', query.raw('reorder_level'));
  }
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: parts, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({
    data: parts,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}));

/**
 * GET /parts/:id - Get a single part by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: part, error } = await req.supabase
    .from('parts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Part');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: part });
}));

/**
 * POST /parts - Create a new part
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = partSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: part, error } = await req.supabase
    .from('parts')
    .insert(validatedData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw ApiError.conflict('A part with this part number already exists');
    }
    throw ApiError.internal(error.message);
  }

  res.status(201).json({ data: part });
}));

/**
 * PUT /parts/:id - Update a part
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = partUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: part, error } = await req.supabase
    .from('parts')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Part');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: part });
}));

/**
 * PATCH /parts/:id - Partial update a part
 */
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = partUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: part, error } = await req.supabase
    .from('parts')
    .update({ ...validatedData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Part');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: part });
}));

/**
 * DELETE /parts/:id - Delete a part (soft delete by setting is_active = false)
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { hard } = z.object({
    hard: z.coerce.boolean().default(false),
  }).parse(req.query);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  if (hard) {
    // Hard delete
    const { error } = await req.supabase
      .from('parts')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Part');
      }
      throw ApiError.internal(error.message);
    }
  } else {
    // Soft delete
    const { error } = await req.supabase
      .from('parts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw ApiError.notFound('Part');
      }
      throw ApiError.internal(error.message);
    }
  }

  res.status(204).send();
}));

/**
 * POST /parts/:id/stock - Adjust stock for a part
 */
router.post('/:id/stock', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity, reason, adjustment_type } = stockAdjustmentSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get current stock
  const { data: part, error: fetchError } = await req.supabase
    .from('parts')
    .select('quantity_in_stock')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiError.notFound('Part');
    }
    throw ApiError.internal(fetchError.message);
  }

  let newQuantity: number;
  switch (adjustment_type) {
    case 'add':
      newQuantity = part.quantity_in_stock + quantity;
      break;
    case 'remove':
      newQuantity = part.quantity_in_stock - quantity;
      if (newQuantity < 0) {
        throw ApiError.badRequest('Cannot remove more than current stock');
      }
      break;
    case 'set':
      newQuantity = quantity;
      break;
  }

  // Update stock
  const { data: updatedPart, error } = await req.supabase
    .from('parts')
    .update({
      quantity_in_stock: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw ApiError.internal(error.message);
  }

  // Log stock adjustment (if stock_adjustments table exists)
  try {
    await req.supabase
      .from('stock_adjustments')
      .insert({
        part_id: id,
        quantity_change: adjustment_type === 'set'
          ? newQuantity - part.quantity_in_stock
          : (adjustment_type === 'add' ? quantity : -quantity),
        previous_quantity: part.quantity_in_stock,
        new_quantity: newQuantity,
        reason,
        adjusted_by: req.user?.id,
      });
  } catch {
    // Table might not exist, ignore error
  }

  res.json({
    data: updatedPart,
    adjustment: {
      type: adjustment_type,
      quantity,
      previous_quantity: part.quantity_in_stock,
      new_quantity: newQuantity,
      reason,
    },
  });
}));

/**
 * GET /parts/categories/list - Get distinct categories
 */
router.get('/categories/list', asyncHandler(async (req: Request, res: Response) => {
  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data, error } = await req.supabase
    .from('parts')
    .select('category')
    .not('category', 'is', null)
    .order('category');

  if (error) {
    throw ApiError.internal(error.message);
  }

  const uniqueCategories = [...new Set(data?.map(d => d.category).filter(Boolean) || [])];

  res.json({ data: uniqueCategories });
}));

/**
 * GET /parts/manufacturers/list - Get distinct manufacturers
 */
router.get('/manufacturers/list', asyncHandler(async (req: Request, res: Response) => {
  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data, error } = await req.supabase
    .from('parts')
    .select('manufacturer')
    .not('manufacturer', 'is', null)
    .order('manufacturer');

  if (error) {
    throw ApiError.internal(error.message);
  }

  const uniqueManufacturers = [...new Set(data?.map(d => d.manufacturer).filter(Boolean) || [])];

  res.json({ data: uniqueManufacturers });
}));

/**
 * GET /parts/low-stock - Get parts below reorder level
 */
router.get('/low-stock/list', asyncHandler(async (req: Request, res: Response) => {
  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: parts, error } = await req.supabase
    .from('parts')
    .select('*')
    .eq('is_active', true)
    .filter('quantity_in_stock', 'lte', 'reorder_level')
    .order('quantity_in_stock', { ascending: true });

  if (error) {
    throw ApiError.internal(error.message);
  }

  // Filter to only include parts actually at or below reorder level
  const lowStockParts = parts?.filter(p => p.quantity_in_stock <= p.reorder_level) || [];

  res.json({
    data: lowStockParts,
    count: lowStockParts.length,
  });
}));

/**
 * POST /parts/search-compatible - Search parts compatible with a vehicle
 */
router.post('/search-compatible', asyncHandler(async (req: Request, res: Response) => {
  const { make, model, search } = z.object({
    make: z.string(),
    model: z.string().optional(),
    search: z.string().optional(),
  }).parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('parts')
    .select('*')
    .eq('is_active', true)
    .contains('compatible_makes', [make]);

  if (model) {
    query = query.contains('compatible_models', [model]);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,part_number.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data: parts, error } = await query.order('name');

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: parts });
}));

export default router;
