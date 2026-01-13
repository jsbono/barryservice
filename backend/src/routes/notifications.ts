import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as NotificationModel from '../models/Notification.js';
import * as notificationService from '../services/notificationService.js';
import { NotificationType, UserType } from '../models/Notification.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/notifications - List notifications for current user
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userType: UserType = req.user!.role === 'customer' ? 'customer' : 'mechanic';

    const {
      type,
      unread,
      limit = '50',
      offset = '0'
    } = req.query;

    const notifications = notificationService.getNotificationsForUser(userId, userType, {
      type: type as NotificationType,
      unreadOnly: unread === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    const unreadCount = notificationService.getUnreadCount(userId, userType);
    const countsByType = NotificationModel.countByType(userId, userType);

    res.json({
      notifications,
      meta: {
        unreadCount,
        countsByType,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Error listing notifications:', error);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

// GET /api/notifications/unread-count - Get unread count only (lightweight)
router.get('/unread-count', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userType: UserType = req.user!.role === 'customer' ? 'customer' : 'mechanic';

    const unreadCount = notificationService.getUnreadCount(userId, userType);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// GET /api/notifications/:id - Get a single notification
router.get('/:id', (req: Request, res: Response) => {
  try {
    const notification = NotificationModel.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify the notification belongs to the current user
    const userId = req.user!.userId;
    const userType: UserType = req.user!.role === 'customer' ? 'customer' : 'mechanic';

    if (notification.user_id !== userId || notification.user_type !== userType) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error getting notification:', error);
    res.status(500).json({ error: 'Failed to get notification' });
  }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', (req: Request, res: Response) => {
  try {
    const notification = NotificationModel.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify the notification belongs to the current user
    const userId = req.user!.userId;
    const userType: UserType = req.user!.role === 'customer' ? 'customer' : 'mechanic';

    if (notification.user_id !== userId || notification.user_type !== userType) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = notificationService.markNotificationRead(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userType: UserType = req.user!.role === 'customer' ? 'customer' : 'mechanic';

    const count = notificationService.markAllNotificationsRead(userId, userType);

    res.json({
      success: true,
      markedRead: count
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const notification = NotificationModel.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Verify the notification belongs to the current user
    const userId = req.user!.userId;
    const userType: UserType = req.user!.role === 'customer' ? 'customer' : 'mechanic';

    if (notification.user_id !== userId || notification.user_type !== userType) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = notificationService.deleteNotification(req.params.id);

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// POST /api/notifications/send-test - Send a test notification (admin only)
router.post('/send-test', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId, userType, email } = req.body;

    // Default to sending to the current admin user
    const targetUserId = userId || req.user!.userId;
    const targetUserType: UserType = userType || 'mechanic';
    const targetEmail = email || undefined;

    const result = await notificationService.sendTestNotification(
      targetUserId,
      targetUserType,
      targetEmail
    );

    res.json({
      success: true,
      notification: result.notification,
      emailSent: result.emailSent
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// POST /api/notifications/run-daily-check - Manually trigger daily service check (admin only)
router.post('/run-daily-check', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('[API] Manually triggering daily service check...');
    const result = await notificationService.runDailyServiceCheck();

    res.json({
      success: true,
      results: result
    });
  } catch (error) {
    console.error('Error running daily service check:', error);
    res.status(500).json({ error: 'Failed to run daily service check' });
  }
});

// POST /api/notifications/cleanup - Clean up old notifications (admin only)
router.post('/cleanup', (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { daysToKeep = 90 } = req.body;

    const deleted = notificationService.cleanupOldNotifications(daysToKeep);

    res.json({
      success: true,
      deleted
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ error: 'Failed to clean up notifications' });
  }
});

// POST /api/notifications/send-service-reminder - Manually send a service reminder (admin/mechanic)
router.post('/send-service-reminder', async (req: Request, res: Response) => {
  try {
    // Check if user is admin or mechanic
    if (!['admin', 'mechanic'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Admin or mechanic access required' });
    }

    const {
      customerId,
      customerName,
      customerEmail,
      vehicle,
      serviceType,
      nextServiceDate,
      nextServiceMileage,
      daysUntilDue,
      serviceLogId
    } = req.body;

    // Validate required fields
    if (!customerId || !customerName || !customerEmail || !vehicle || !serviceType) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, customerName, customerEmail, vehicle, serviceType'
      });
    }

    const result = await notificationService.sendServiceReminder({
      customerId,
      customerName,
      customerEmail,
      vehicle: {
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin
      },
      serviceType,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      nextServiceMileage,
      daysUntilDue,
      serviceLogId
    });

    res.json({
      success: true,
      emailSent: result.email,
      notification: result.notification
    });
  } catch (error) {
    console.error('Error sending service reminder:', error);
    res.status(500).json({ error: 'Failed to send service reminder' });
  }
});

// POST /api/notifications/send-invoice-ready - Send invoice ready notification (admin/mechanic)
router.post('/send-invoice-ready', async (req: Request, res: Response) => {
  try {
    // Check if user is admin or mechanic
    if (!['admin', 'mechanic'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Admin or mechanic access required' });
    }

    const {
      customerId,
      customerName,
      customerEmail,
      vehicle,
      invoiceNumber,
      totalAmount,
      dueDate,
      portalUrl
    } = req.body;

    // Validate required fields
    if (!customerId || !customerName || !customerEmail || !vehicle || !invoiceNumber || totalAmount === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, customerName, customerEmail, vehicle, invoiceNumber, totalAmount'
      });
    }

    const result = await notificationService.sendInvoiceReadyNotification({
      customerId,
      customerName,
      customerEmail,
      vehicle: {
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin
      },
      invoiceNumber,
      totalAmount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      portalUrl
    });

    res.json({
      success: true,
      emailSent: result.email,
      notification: result.notification
    });
  } catch (error) {
    console.error('Error sending invoice ready notification:', error);
    res.status(500).json({ error: 'Failed to send invoice ready notification' });
  }
});

export default router;
