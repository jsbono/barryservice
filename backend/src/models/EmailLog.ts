import { query, queryOne, execute } from '../config/db.js';
import { EmailLog } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export function findByServiceLogId(serviceLogId: string): EmailLog[] {
  return query<EmailLog>(
    'SELECT * FROM email_logs WHERE service_log_id = ? ORDER BY email_sent_at DESC',
    [serviceLogId]
  );
}

export function findRecentByServiceLogId(serviceLogId: string, days: number): EmailLog | null {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return queryOne<EmailLog>(
    `SELECT * FROM email_logs
     WHERE service_log_id = ? AND email_sent_at >= ?
     ORDER BY email_sent_at DESC
     LIMIT 1`,
    [serviceLogId, cutoffDate.toISOString()]
  );
}

export function create(serviceLogId: string): EmailLog {
  const id = uuidv4();
  const now = new Date().toISOString();
  execute(
    `INSERT INTO email_logs (id, service_log_id, email_sent_at)
     VALUES (?, ?, ?)`,
    [id, serviceLogId, now]
  );
  return queryOne<EmailLog>('SELECT * FROM email_logs WHERE id = ?', [id])!;
}
