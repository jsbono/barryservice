import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { sendNotification, NotificationType } from '../services/notification-service.js';

const router = Router();

// Validation schemas
const notificationSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  type: z.enum(['service_reminder', 'invoice', 'appointment', 'general']),
  channel: z.enum(['email', 'sms', 'in_app', 'push']).default('in_app'),
  subject: z.string().max(200),
  message: z.string().max(2000),
  scheduled_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const notificationUpdateSchema = z.object({
  status: z.enum(['pending', 'sent', 'read', 'failed', 'cancelled']).optional(),
  read_at: z.string().datetime().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customer_id: z.string().uuid().optional(),
  type: z.enum(['service_reminder', 'invoice', 'appointment', 'general']).optional(),
  channel: z.enum(['email', 'sms', 'in_app', 'push']).optional(),
  status: z.enum(['pending', 'sent', 'read', 'failed', 'cancelled']).optional(),
  unread_only: z.coerce.boolean().optional(),
  sort_by: z.enum(['created_at', 'scheduled_at', 'sent_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /notifications - List all notifications with pagination and filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, customer_id, type, channel, status, unread_only, sort_by, sort_order } =
    querySchema.parse(req.query);
  const offset = (page - 1) * limit;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('notifications')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone)
    `, { count: 'exact' });

  // Apply filters
  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (channel) {
    query = query.eq('channel', channel);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (unread_only) {
    query = query.is('read_at', null).eq('status', 'sent');
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({
    data: notifications,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}));

/**
 * GET /notifications/:id - Get a single notification by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: notification, error } = await req.supabase
    .from('notifications')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Notification');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: notification });
}));

/**
 * POST /notifications - Create and optionally send a notification
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = notificationSchema.parse(req.body);
  const { send_immediately } = z.object({
    send_immediately: z.coerce.boolean().default(false),
  }).parse(req.query);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get customer info for sending
  const { data: customer, error: customerError } = await req.supabase
    .from('customers')
    .select('*')
    .eq('id', validatedData.customer_id)
    .single();

  if (customerError || !customer) {
    throw ApiError.badRequest('Customer not found');
  }

  // Create notification record
  const { data: notification, error } = await req.supabase
    .from('notifications')
    .insert({
      ...validatedData,
      status: send_immediately ? 'pending' : 'pending',
    })
    .select()
    .single();

  if (error) {
    throw ApiError.internal(error.message);
  }

  // Send immediately if requested
  if (send_immediately) {
    try {
      await sendNotification({
        type: validatedData.type as NotificationType,
        channel: validatedData.channel,
        recipient: {
          email: customer.email,
          phone: customer.phone,
          name: `${customer.first_name} ${customer.last_name}`,
        },
        subject: validatedData.subject,
        message: validatedData.message,
        metadata: validatedData.metadata,
      });

      // Update notification status
      await req.supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      notification.status = 'sent';
      notification.sent_at = new Date().toISOString();
    } catch (sendError) {
      console.error('Failed to send notification:', sendError);
      await req.supabase
        .from('notifications')
        .update({
          status: 'failed',
          error_message: sendError instanceof Error ? sendError.message : 'Unknown error',
        })
        .eq('id', notification.id);

      notification.status = 'failed';
    }
  }

  res.status(201).json({ data: notification });
}));

/**
 * POST /notifications/:id/send - Send a pending notification
 */
router.post('/:id/send', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Get notification with customer
  const { data: notification, error: fetchError } = await req.supabase
    .from('notifications')
    .select(`
      *,
      customer:customers(*)
    `)
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiError.notFound('Notification');
    }
    throw ApiError.internal(fetchError.message);
  }

  if (notification.status === 'sent') {
    throw ApiError.badRequest('Notification already sent');
  }

  if (notification.status === 'cancelled') {
    throw ApiError.badRequest('Cannot send cancelled notification');
  }

  try {
    await sendNotification({
      type: notification.type as NotificationType,
      channel: notification.channel,
      recipient: {
        email: notification.customer.email,
        phone: notification.customer.phone,
        name: `${notification.customer.first_name} ${notification.customer.last_name}`,
      },
      subject: notification.subject,
      message: notification.message,
      metadata: notification.metadata,
    });

    const { data: updated, error: updateError } = await req.supabase
      .from('notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ data: updated });
  } catch (sendError) {
    await req.supabase
      .from('notifications')
      .update({
        status: 'failed',
        error_message: sendError instanceof Error ? sendError.message : 'Unknown error',
      })
      .eq('id', id);

    throw ApiError.internal('Failed to send notification');
  }
}));

/**
 * PATCH /notifications/:id - Update notification (mark as read, etc.)
 */
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = notificationUpdateSchema.parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: notification, error } = await req.supabase
    .from('notifications')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Notification');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: notification });
}));

/**
 * POST /notifications/:id/read - Mark notification as read
 */
router.post('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { data: notification, error } = await req.supabase
    .from('notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Notification');
    }
    throw ApiError.internal(error.message);
  }

  res.json({ data: notification });
}));

/**
 * POST /notifications/read-all - Mark all notifications as read for current user
 */
router.post('/read-all', asyncHandler(async (req: Request, res: Response) => {
  const { customer_id } = z.object({
    customer_id: z.string().uuid().optional(),
  }).parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('notifications')
    .update({
      status: 'read',
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'sent')
    .is('read_at', null);

  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }

  const { error } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ message: 'All notifications marked as read' });
}));

/**
 * DELETE /notifications/:id - Delete a notification
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  const { error } = await req.supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      throw ApiError.notFound('Notification');
    }
    throw ApiError.internal(error.message);
  }

  res.status(204).send();
}));

/**
 * POST /notifications/bulk - Send bulk notifications
 */
router.post('/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { customer_ids, type, channel, subject, message, metadata } = z.object({
    customer_ids: z.array(z.string().uuid()).min(1).max(100),
    type: z.enum(['service_reminder', 'invoice', 'appointment', 'general']),
    channel: z.enum(['email', 'sms', 'in_app', 'push']).default('in_app'),
    subject: z.string().max(200),
    message: z.string().max(2000),
    metadata: z.record(z.unknown()).optional(),
  }).parse(req.body);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  // Create notification records for all customers
  const notifications = customer_ids.map(customer_id => ({
    customer_id,
    type,
    channel,
    subject,
    message,
    metadata,
    status: 'pending',
  }));

  const { data: created, error } = await req.supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.status(201).json({
    data: created,
    message: `${created?.length || 0} notifications created`,
  });
}));

/**
 * GET /notifications/unread-count - Get count of unread notifications
 */
router.get('/unread/count', asyncHandler(async (req: Request, res: Response) => {
  const { customer_id } = z.object({
    customer_id: z.string().uuid().optional(),
  }).parse(req.query);

  if (!req.supabase) {
    throw ApiError.internal('Database client not initialized');
  }

  let query = req.supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .is('read_at', null);

  if (customer_id) {
    query = query.eq('customer_id', customer_id);
  }

  const { count, error } = await query;

  if (error) {
    throw ApiError.internal(error.message);
  }

  res.json({ data: { unread_count: count || 0 } });
}));

export default router;
