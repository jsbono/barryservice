import { query, queryOne, execute } from '../config/db.js';
import { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleWithCustomer } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import * as CustomerModel from './Customer.js';

export function findAll(customerId?: string, limit = 100, offset = 0): Vehicle[] {
  if (customerId) {
    return query<Vehicle>(
      'SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [customerId, limit, offset]
    );
  }
  return query<Vehicle>(
    'SELECT * FROM vehicles ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

export function findById(id: string): Vehicle | null {
  return queryOne<Vehicle>('SELECT * FROM vehicles WHERE id = ?', [id]);
}

export function findByIdWithCustomer(id: string): VehicleWithCustomer | null {
  const vehicle = findById(id);
  if (!vehicle) return null;

  const customer = CustomerModel.findById(vehicle.customer_id);
  return { ...vehicle, customer: customer || undefined };
}

export function findByCustomerId(customerId: string): Vehicle[] {
  return query<Vehicle>(
    'SELECT * FROM vehicles WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );
}

export function create(data: CreateVehicleRequest): Vehicle {
  const id = uuidv4();
  const now = new Date().toISOString();
  execute(
    `INSERT INTO vehicles (id, customer_id, make, model, year, vin, mileage, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.customer_id, data.make, data.model, data.year, data.vin || null, data.mileage || null, now]
  );
  return findById(id)!;
}

export function update(id: string, data: UpdateVehicleRequest): Vehicle | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.make !== undefined) {
    fields.push(`make = ?`);
    values.push(data.make);
  }
  if (data.model !== undefined) {
    fields.push(`model = ?`);
    values.push(data.model);
  }
  if (data.year !== undefined) {
    fields.push(`year = ?`);
    values.push(data.year);
  }
  if (data.vin !== undefined) {
    fields.push(`vin = ?`);
    values.push(data.vin);
  }
  if (data.mileage !== undefined) {
    fields.push(`mileage = ?`);
    values.push(data.mileage);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);
  execute(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function remove(id: string): boolean {
  const count = execute('DELETE FROM vehicles WHERE id = ?', [id]);
  return count > 0;
}

export function count(customerId?: string): number {
  if (customerId) {
    const result = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM vehicles WHERE customer_id = ?',
      [customerId]
    );
    return result?.count || 0;
  }
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM vehicles');
  return result?.count || 0;
}

export interface VehicleWithCustomerInfo extends Vehicle {
  customer_name: string;
  customer_email: string;
}

export function findAllWithCustomers(): VehicleWithCustomerInfo[] {
  return query<VehicleWithCustomerInfo>(
    `SELECT v.*, c.name as customer_name, c.email as customer_email
     FROM vehicles v
     JOIN customers c ON v.customer_id = c.id
     ORDER BY v.created_at DESC`
  );
}
