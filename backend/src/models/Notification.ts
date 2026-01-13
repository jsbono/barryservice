import { query, queryOne, execute } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Notification types for MotorAI
export type NotificationType =
  | 'oil_change_due'
  | 'minor_service_due'
  | 'major_service_due'
  | 'invoice_ready'
  | 'overdue_service'
  | 'service_reminder'
  | 'appointment_reminder'
  | 'service_complete';

export type UserType = 'customer' | 'mechanic' | 'admin';

export interface Notification {
  id: string;
  user_id: string;
  user_type: UserType;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: string | null;
  read: number;
  read_at: string | null;
  created_at: string;
}

export interface NotificationWithMeta extends Notification {
  parsedMetadata?: Record<string, any>;
}

export interface CreateNotificationRequest {
  user_id: string;
  user_type: UserType;
  type: NotificationType;
  title?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  user_id: string;
  user_type: UserType;
  type?: NotificationType;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

// Find all notifications for a user
export function findByUser(filters: NotificationFilters): NotificationWithMeta[] {
  const { user_id, user_type, type, unreadOnly, limit = 50, offset = 0 } = filters;

  let sql = 'SELECT * FROM notifications WHERE user_id = ? AND user_type = ?';
  const params: any[] = [user_id, user_type];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (unreadOnly) {
    sql += ' AND read = 0';
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const notifications = query<Notification>(sql, params);

  return notifications.map(n => ({
    ...n,
    parsedMetadata: n.metadata ? JSON.parse(n.metadata) : undefined
  }));
}

// Find a single notification by ID
export function findById(id: string): NotificationWithMeta | null {
  const notification = queryOne<Notification>(
    'SELECT * FROM notifications WHERE id = ?',
    [id]
  );

  if (!notification) return null;

  return {
    ...notification,
    parsedMetadata: notification.metadata ? JSON.parse(notification.metadata) : undefined
  };
}

// Create a new notification
export function create(data: CreateNotificationRequest): NotificationWithMeta {
  const id = uuidv4();
  const now = new Date().toISOString();
  const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

  execute(
    `INSERT INTO notifications (id, user_id, user_type, type, title, message, metadata, read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      data.user_id,
      data.user_type,
      data.type,
      data.title || null,
      data.message,
      metadata,
      now
    ]
  );

  return findById(id)!;
}

// Mark a notification as read
export function markRead(id: string): NotificationWithMeta | null {
  const now = new Date().toISOString();
  execute(
    'UPDATE notifications SET read = 1, read_at = ? WHERE id = ? AND read = 0',
    [now, id]
  );
  return findById(id);
}

// Mark all notifications as read for a user
export function markAllRead(user_id: string, user_type: UserType): number {
  const now = new Date().toISOString();
  return execute(
    'UPDATE notifications SET read = 1, read_at = ? WHERE user_id = ? AND user_type = ? AND read = 0',
    [now, user_id, user_type]
  );
}

// Delete a notification
export function remove(id: string): boolean {
  const count = execute('DELETE FROM notifications WHERE id = ?', [id]);
  return count > 0;
}

// Delete notifications older than specified days
export function deleteOlderThan(days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return execute('DELETE FROM notifications WHERE created_at < ?', [cutoff.toISOString()]);
}

// Count unread notifications for a user
export function countUnread(user_id: string, user_type: UserType): number {
  const result = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? AND read = 0',
    [user_id, user_type]
  );
  return result?.count || 0;
}

// Check if a notification of a specific type was sent recently (for duplicate prevention)
export function findRecentByType(
  user_id: string,
  user_type: UserType,
  type: NotificationType,
  vehicle_id?: string,
  days: number = 7
): Notification | null {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let sql = `
    SELECT * FROM notifications
    WHERE user_id = ? AND user_type = ? AND type = ? AND created_at >= ?
  `;
  const params: any[] = [user_id, user_type, type, cutoffDate.toISOString()];

  // If vehicle_id is provided, check metadata for it
  if (vehicle_id) {
    sql += ` AND metadata LIKE ?`;
    params.push(`%"vehicle_id":"${vehicle_id}"%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT 1';

  return queryOne<Notification>(sql, params);
}

// Find notifications by vehicle (useful for service-related notifications)
export function findByVehicle(vehicle_id: string, limit: number = 20): NotificationWithMeta[] {
  const notifications = query<Notification>(
    `SELECT * FROM notifications
     WHERE metadata LIKE ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [`%"vehicle_id":"${vehicle_id}"%`, limit]
  );

  return notifications.map(n => ({
    ...n,
    parsedMetadata: n.metadata ? JSON.parse(n.metadata) : undefined
  }));
}

// Bulk create notifications (for batch operations)
export function createBulk(notifications: CreateNotificationRequest[]): number {
  let created = 0;
  const now = new Date().toISOString();

  for (const data of notifications) {
    const id = uuidv4();
    const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

    try {
      execute(
        `INSERT INTO notifications (id, user_id, user_type, type, title, message, metadata, read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          id,
          data.user_id,
          data.user_type,
          data.type,
          data.title || null,
          data.message,
          metadata,
          now
        ]
      );
      created++;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  return created;
}

// Get notification counts by type for a user
export function countByType(user_id: string, user_type: UserType): Record<string, number> {
  const results = query<{ type: string; count: number }>(
    `SELECT type, COUNT(*) as count FROM notifications
     WHERE user_id = ? AND user_type = ?
     GROUP BY type`,
    [user_id, user_type]
  );

  const counts: Record<string, number> = {};
  results.forEach(r => {
    counts[r.type] = r.count;
  });

  return counts;
}
