import { query, queryOne, execute } from '../config/db.js';
import { ServiceLog, CreateServiceLogRequest, UpdateServiceLogRequest, ServiceLogWithVehicle } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import * as VehicleModel from './Vehicle.js';
import * as CustomerModel from './Customer.js';

export function findAll(vehicleId?: string, limit = 100, offset = 0): ServiceLog[] {
  if (vehicleId) {
    return query<ServiceLog>(
      'SELECT * FROM service_logs WHERE vehicle_id = ? ORDER BY service_date DESC LIMIT ? OFFSET ?',
      [vehicleId, limit, offset]
    );
  }
  return query<ServiceLog>(
    'SELECT * FROM service_logs ORDER BY service_date DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

export function findById(id: string): ServiceLog | null {
  return queryOne<ServiceLog>('SELECT * FROM service_logs WHERE id = ?', [id]);
}

export function findByVehicleId(vehicleId: string): ServiceLog[] {
  return query<ServiceLog>(
    'SELECT * FROM service_logs WHERE vehicle_id = ? ORDER BY service_date DESC',
    [vehicleId]
  );
}

export function findUpcoming(daysAhead = 30): ServiceLogWithVehicle[] {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const today = new Date().toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const logs = query<ServiceLog>(
    `SELECT * FROM service_logs
     WHERE next_service_date IS NOT NULL
       AND next_service_date <= ?
       AND next_service_date >= ?
     ORDER BY next_service_date ASC`,
    [futureDateStr, today]
  );

  return logs.map((log) => {
    const vehicle = VehicleModel.findById(log.vehicle_id);
    let customer = undefined;
    if (vehicle) {
      customer = CustomerModel.findById(vehicle.customer_id) || undefined;
    }
    return {
      ...log,
      vehicle: vehicle ? { ...vehicle, customer } : undefined,
    };
  });
}

export function findRecentActivity(limit = 10): ServiceLogWithVehicle[] {
  const logs = query<ServiceLog>(
    'SELECT * FROM service_logs ORDER BY created_at DESC LIMIT ?',
    [limit]
  );

  return logs.map((log) => {
    const vehicle = VehicleModel.findById(log.vehicle_id);
    let customer = undefined;
    if (vehicle) {
      customer = CustomerModel.findById(vehicle.customer_id) || undefined;
    }
    return {
      ...log,
      vehicle: vehicle ? { ...vehicle, customer } : undefined,
    };
  });
}

export function create(
  data: CreateServiceLogRequest,
  nextServiceDate?: Date,
  nextServiceMileage?: number
): ServiceLog {
  const id = uuidv4();
  const now = new Date().toISOString();
  execute(
    `INSERT INTO service_logs (id, vehicle_id, service_type, notes, service_date, mileage_at_service, labor_hours, next_service_date, next_service_mileage, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.vehicle_id,
      data.service_type,
      data.notes || null,
      data.service_date,
      data.mileage_at_service || null,
      data.labor_hours || null,
      nextServiceDate ? nextServiceDate.toISOString().split('T')[0] : null,
      nextServiceMileage || null,
      now,
    ]
  );
  return findById(id)!;
}

export function update(id: string, data: UpdateServiceLogRequest): ServiceLog | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.service_type !== undefined) {
    fields.push(`service_type = ?`);
    values.push(data.service_type);
  }
  if (data.notes !== undefined) {
    fields.push(`notes = ?`);
    values.push(data.notes);
  }
  if (data.service_date !== undefined) {
    fields.push(`service_date = ?`);
    values.push(data.service_date);
  }
  if (data.mileage_at_service !== undefined) {
    fields.push(`mileage_at_service = ?`);
    values.push(data.mileage_at_service);
  }
  if (data.labor_hours !== undefined) {
    fields.push(`labor_hours = ?`);
    values.push(data.labor_hours);
  }
  if (data.next_service_date !== undefined) {
    fields.push(`next_service_date = ?`);
    values.push(data.next_service_date);
  }
  if (data.next_service_mileage !== undefined) {
    fields.push(`next_service_mileage = ?`);
    values.push(data.next_service_mileage);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);
  execute(`UPDATE service_logs SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function remove(id: string): boolean {
  const count = execute('DELETE FROM service_logs WHERE id = ?', [id]);
  return count > 0;
}

export function count(vehicleId?: string): number {
  if (vehicleId) {
    const result = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM service_logs WHERE vehicle_id = ?',
      [vehicleId]
    );
    return result?.count || 0;
  }
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM service_logs');
  return result?.count || 0;
}
