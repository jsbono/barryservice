import { query, queryOne, execute } from '../config/db.js';
import { Insight, InsightWithRelations, CreateInsightRequest } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export function findAll(options: {
  limit?: number;
  offset?: number;
  type?: string;
  priority?: string;
  unreadOnly?: boolean;
  includeExpired?: boolean;
} = {}): Insight[] {
  const { limit = 50, offset = 0, type, priority, unreadOnly, includeExpired } = options;

  let sql = 'SELECT * FROM insights WHERE dismissed_at IS NULL';
  const params: any[] = [];

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (priority) {
    sql += ' AND priority = ?';
    params.push(priority);
  }

  if (unreadOnly) {
    sql += ' AND read_at IS NULL';
  }

  if (!includeExpired) {
    sql += " AND (expires_at IS NULL OR expires_at > datetime('now'))";
  }

  sql += " ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC";
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return query<Insight>(sql, params);
}

export function findById(id: string): Insight | null {
  return queryOne<Insight>('SELECT * FROM insights WHERE id = ?', [id]);
}

export function findByIdWithRelations(id: string): InsightWithRelations | null {
  const insight = findById(id);
  if (!insight) return null;

  const result: InsightWithRelations = { ...insight };

  if (insight.customer_id) {
    const customer = queryOne('SELECT * FROM customers WHERE id = ?', [insight.customer_id]);
    if (customer) result.customer = customer;
  }

  if (insight.vehicle_id) {
    const vehicle = queryOne('SELECT * FROM vehicles WHERE id = ?', [insight.vehicle_id]);
    if (vehicle) result.vehicle = vehicle;
  }

  return result;
}

export function findAllWithRelations(options: Parameters<typeof findAll>[0] = {}): InsightWithRelations[] {
  const insights = findAll(options);

  return insights.map(insight => {
    const result: InsightWithRelations = { ...insight };

    if (insight.customer_id) {
      const customer = queryOne('SELECT * FROM customers WHERE id = ?', [insight.customer_id]);
      if (customer) result.customer = customer;
    }

    if (insight.vehicle_id) {
      const vehicle = queryOne('SELECT * FROM vehicles WHERE id = ?', [insight.vehicle_id]);
      if (vehicle) result.vehicle = vehicle;
    }

    return result;
  });
}

export function create(data: CreateInsightRequest): Insight {
  const id = uuidv4();
  const now = new Date().toISOString();
  const metadata = data.metadata ? JSON.stringify(data.metadata) : null;

  execute(
    `INSERT INTO insights (id, type, priority, title, body, customer_id, vehicle_id, action_type, action_url, metadata, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.type,
      data.priority,
      data.title,
      data.body,
      data.customer_id || null,
      data.vehicle_id || null,
      data.action_type || null,
      data.action_url || null,
      metadata,
      now,
      data.expires_at || null
    ]
  );

  return findById(id)!;
}

export function markRead(id: string): Insight | null {
  const now = new Date().toISOString();
  execute('UPDATE insights SET read_at = ? WHERE id = ? AND read_at IS NULL', [now, id]);
  return findById(id);
}

export function markActioned(id: string): Insight | null {
  const now = new Date().toISOString();
  execute('UPDATE insights SET actioned_at = ?, read_at = COALESCE(read_at, ?) WHERE id = ?', [now, now, id]);
  return findById(id);
}

export function dismiss(id: string): Insight | null {
  const now = new Date().toISOString();
  execute('UPDATE insights SET dismissed_at = ? WHERE id = ?', [now, id]);
  return findById(id);
}

export function remove(id: string): boolean {
  const count = execute('DELETE FROM insights WHERE id = ?', [id]);
  return count > 0;
}

export function countUnread(): number {
  const result = queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM insights WHERE read_at IS NULL AND dismissed_at IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))"
  );
  return result?.count || 0;
}

export function countByPriority(): { high: number; medium: number; low: number } {
  const results = query<{ priority: string; count: number }>(
    `SELECT priority, COUNT(*) as count FROM insights
     WHERE dismissed_at IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))
     GROUP BY priority`
  );

  const counts = { high: 0, medium: 0, low: 0 };
  results.forEach(r => {
    if (r.priority in counts) {
      counts[r.priority as keyof typeof counts] = r.count;
    }
  });

  return counts;
}

export function deleteOlderThan(days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return execute('DELETE FROM insights WHERE created_at < ?', [cutoff.toISOString()]);
}
