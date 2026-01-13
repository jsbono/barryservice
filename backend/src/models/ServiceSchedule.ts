/**
 * ServiceSchedule Model for MotorAI
 *
 * Manages service schedules for vehicles, tracking intervals and next service dates
 * for oil changes, minor services, and major services.
 */

import { query, queryOne, execute } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface ServiceSchedule {
  id: string;
  vehicle_id: string;
  vehicle_category: string; // truck, suv, sedan, hybrid, electric, etc.
  last_service_date: string | null;
  last_service_mileage: number | null;
  // Oil change intervals
  oil_change_interval_miles: number | null;
  oil_change_interval_months: number | null;
  next_oil_change_date: string | null;
  next_oil_change_mileage: number | null;
  // Minor service intervals
  minor_service_interval_miles: number | null;
  minor_service_interval_months: number | null;
  next_minor_service_date: string | null;
  next_minor_service_mileage: number | null;
  // Major service intervals
  major_service_interval_miles: number | null;
  major_service_interval_months: number | null;
  next_major_service_date: string | null;
  next_major_service_mileage: number | null;
  // Configuration storage
  interval_config: string | null; // JSON string with full interval configuration
  created_at: string;
  updated_at: string;
}

export interface CreateServiceScheduleRequest {
  vehicle_id: string;
  vehicle_category: string;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
  oil_change_interval_miles?: number | null;
  oil_change_interval_months?: number | null;
  minor_service_interval_miles?: number | null;
  minor_service_interval_months?: number | null;
  major_service_interval_miles?: number | null;
  major_service_interval_months?: number | null;
  next_oil_change_date?: string | null;
  next_oil_change_mileage?: number | null;
  next_minor_service_date?: string | null;
  next_minor_service_mileage?: number | null;
  next_major_service_date?: string | null;
  next_major_service_mileage?: number | null;
  interval_config?: string | null;
}

export interface UpdateServiceScheduleRequest {
  vehicle_category?: string;
  last_service_date?: string | null;
  last_service_mileage?: number | null;
  oil_change_interval_miles?: number | null;
  oil_change_interval_months?: number | null;
  minor_service_interval_miles?: number | null;
  minor_service_interval_months?: number | null;
  major_service_interval_miles?: number | null;
  major_service_interval_months?: number | null;
  next_oil_change_date?: string | null;
  next_oil_change_mileage?: number | null;
  next_minor_service_date?: string | null;
  next_minor_service_mileage?: number | null;
  next_major_service_date?: string | null;
  next_major_service_mileage?: number | null;
  interval_config?: string | null;
}

export function findAll(limit = 100, offset = 0): ServiceSchedule[] {
  return query<ServiceSchedule>(
    'SELECT * FROM service_schedules ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

export function findById(id: string): ServiceSchedule | null {
  return queryOne<ServiceSchedule>('SELECT * FROM service_schedules WHERE id = ?', [id]);
}

export function findByVehicleId(vehicleId: string): ServiceSchedule | null {
  return queryOne<ServiceSchedule>(
    'SELECT * FROM service_schedules WHERE vehicle_id = ?',
    [vehicleId]
  );
}

export function findUpcoming(daysAhead = 30): ServiceSchedule[] {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  return query<ServiceSchedule>(
    `SELECT * FROM service_schedules
     WHERE (next_oil_change_date <= ? AND next_oil_change_date >= ?)
        OR (next_minor_service_date <= ? AND next_minor_service_date >= ?)
        OR (next_major_service_date <= ? AND next_major_service_date >= ?)
     ORDER BY
       COALESCE(
         CASE
           WHEN next_oil_change_date <= ? THEN next_oil_change_date
           ELSE NULL
         END,
         CASE
           WHEN next_minor_service_date <= ? THEN next_minor_service_date
           ELSE NULL
         END,
         next_major_service_date
       ) ASC`,
    [futureDateStr, today, futureDateStr, today, futureDateStr, today, futureDateStr, futureDateStr]
  );
}

export function findOverdue(): ServiceSchedule[] {
  const today = new Date().toISOString().split('T')[0];

  return query<ServiceSchedule>(
    `SELECT * FROM service_schedules
     WHERE next_oil_change_date < ?
        OR next_minor_service_date < ?
        OR next_major_service_date < ?
     ORDER BY
       COALESCE(
         CASE WHEN next_oil_change_date < ? THEN next_oil_change_date ELSE NULL END,
         CASE WHEN next_minor_service_date < ? THEN next_minor_service_date ELSE NULL END,
         next_major_service_date
       ) ASC`,
    [today, today, today, today, today]
  );
}

export function create(data: CreateServiceScheduleRequest): ServiceSchedule {
  const id = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO service_schedules (
      id, vehicle_id, vehicle_category, last_service_date, last_service_mileage,
      oil_change_interval_miles, oil_change_interval_months,
      minor_service_interval_miles, minor_service_interval_months,
      major_service_interval_miles, major_service_interval_months,
      next_oil_change_date, next_oil_change_mileage,
      next_minor_service_date, next_minor_service_mileage,
      next_major_service_date, next_major_service_mileage,
      interval_config, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.vehicle_id,
      data.vehicle_category,
      data.last_service_date || null,
      data.last_service_mileage || null,
      data.oil_change_interval_miles || null,
      data.oil_change_interval_months || null,
      data.minor_service_interval_miles || null,
      data.minor_service_interval_months || null,
      data.major_service_interval_miles || null,
      data.major_service_interval_months || null,
      data.next_oil_change_date || null,
      data.next_oil_change_mileage || null,
      data.next_minor_service_date || null,
      data.next_minor_service_mileage || null,
      data.next_major_service_date || null,
      data.next_major_service_mileage || null,
      data.interval_config || null,
      now,
      now,
    ]
  );

  return findById(id)!;
}

export function update(id: string, data: UpdateServiceScheduleRequest): ServiceSchedule | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.vehicle_category !== undefined) {
    fields.push('vehicle_category = ?');
    values.push(data.vehicle_category);
  }
  if (data.last_service_date !== undefined) {
    fields.push('last_service_date = ?');
    values.push(data.last_service_date);
  }
  if (data.last_service_mileage !== undefined) {
    fields.push('last_service_mileage = ?');
    values.push(data.last_service_mileage);
  }
  if (data.oil_change_interval_miles !== undefined) {
    fields.push('oil_change_interval_miles = ?');
    values.push(data.oil_change_interval_miles);
  }
  if (data.oil_change_interval_months !== undefined) {
    fields.push('oil_change_interval_months = ?');
    values.push(data.oil_change_interval_months);
  }
  if (data.minor_service_interval_miles !== undefined) {
    fields.push('minor_service_interval_miles = ?');
    values.push(data.minor_service_interval_miles);
  }
  if (data.minor_service_interval_months !== undefined) {
    fields.push('minor_service_interval_months = ?');
    values.push(data.minor_service_interval_months);
  }
  if (data.major_service_interval_miles !== undefined) {
    fields.push('major_service_interval_miles = ?');
    values.push(data.major_service_interval_miles);
  }
  if (data.major_service_interval_months !== undefined) {
    fields.push('major_service_interval_months = ?');
    values.push(data.major_service_interval_months);
  }
  if (data.next_oil_change_date !== undefined) {
    fields.push('next_oil_change_date = ?');
    values.push(data.next_oil_change_date);
  }
  if (data.next_oil_change_mileage !== undefined) {
    fields.push('next_oil_change_mileage = ?');
    values.push(data.next_oil_change_mileage);
  }
  if (data.next_minor_service_date !== undefined) {
    fields.push('next_minor_service_date = ?');
    values.push(data.next_minor_service_date);
  }
  if (data.next_minor_service_mileage !== undefined) {
    fields.push('next_minor_service_mileage = ?');
    values.push(data.next_minor_service_mileage);
  }
  if (data.next_major_service_date !== undefined) {
    fields.push('next_major_service_date = ?');
    values.push(data.next_major_service_date);
  }
  if (data.next_major_service_mileage !== undefined) {
    fields.push('next_major_service_mileage = ?');
    values.push(data.next_major_service_mileage);
  }
  if (data.interval_config !== undefined) {
    fields.push('interval_config = ?');
    values.push(data.interval_config);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  // Always update the updated_at timestamp
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(id);
  execute(`UPDATE service_schedules SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function remove(id: string): boolean {
  const count = execute('DELETE FROM service_schedules WHERE id = ?', [id]);
  return count > 0;
}

export function removeByVehicleId(vehicleId: string): boolean {
  const count = execute('DELETE FROM service_schedules WHERE vehicle_id = ?', [vehicleId]);
  return count > 0;
}

export function count(): number {
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM service_schedules');
  return result?.count || 0;
}

// Extended interface for schedule with vehicle info
export interface ServiceScheduleWithVehicle extends ServiceSchedule {
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  customer_name?: string;
  customer_email?: string;
}

export function findAllWithVehicles(limit = 100, offset = 0): ServiceScheduleWithVehicle[] {
  return query<ServiceScheduleWithVehicle>(
    `SELECT ss.*, v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
            c.name as customer_name, c.email as customer_email
     FROM service_schedules ss
     JOIN vehicles v ON ss.vehicle_id = v.id
     JOIN customers c ON v.customer_id = c.id
     ORDER BY ss.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export function findUpcomingWithVehicles(daysAhead = 30): ServiceScheduleWithVehicle[] {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  return query<ServiceScheduleWithVehicle>(
    `SELECT ss.*, v.make as vehicle_make, v.model as vehicle_model, v.year as vehicle_year,
            c.name as customer_name, c.email as customer_email
     FROM service_schedules ss
     JOIN vehicles v ON ss.vehicle_id = v.id
     JOIN customers c ON v.customer_id = c.id
     WHERE (ss.next_oil_change_date <= ? AND ss.next_oil_change_date >= ?)
        OR (ss.next_minor_service_date <= ? AND ss.next_minor_service_date >= ?)
        OR (ss.next_major_service_date <= ? AND ss.next_major_service_date >= ?)
     ORDER BY
       COALESCE(
         CASE WHEN ss.next_oil_change_date <= ? THEN ss.next_oil_change_date ELSE NULL END,
         CASE WHEN ss.next_minor_service_date <= ? THEN ss.next_minor_service_date ELSE NULL END,
         ss.next_major_service_date
       ) ASC`,
    [futureDateStr, today, futureDateStr, today, futureDateStr, today, futureDateStr, futureDateStr]
  );
}
