import { query, queryOne, execute } from '../config/db.js';
import { ServicePrice, CreateServicePriceRequest, UpdateServicePriceRequest, LaborRate, UpdateLaborRateRequest } from './types.js';
import { v4 as uuidv4 } from 'uuid';

// Service Prices

export function findAllServicePrices(includeInactive = false): ServicePrice[] {
  const whereClause = includeInactive ? '' : 'WHERE is_active = 1';
  return query<ServicePrice>(
    `SELECT * FROM service_prices ${whereClause} ORDER BY display_name ASC`,
    []
  );
}

export function findServicePriceById(id: string): ServicePrice | null {
  return queryOne<ServicePrice>('SELECT * FROM service_prices WHERE id = ?', [id]);
}

export function findServicePriceByType(serviceType: string): ServicePrice | null {
  return queryOne<ServicePrice>('SELECT * FROM service_prices WHERE service_type = ?', [serviceType]);
}

export function createServicePrice(data: CreateServicePriceRequest): ServicePrice {
  const id = uuidv4();
  const now = new Date().toISOString();

  execute(
    `INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.service_type,
      data.display_name,
      data.base_price,
      data.labor_hours,
      data.description || null,
      now,
      now,
    ]
  );

  return findServicePriceById(id)!;
}

export function updateServicePrice(id: string, data: UpdateServicePriceRequest): ServicePrice | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.display_name !== undefined) {
    fields.push('display_name = ?');
    values.push(data.display_name);
  }
  if (data.base_price !== undefined) {
    fields.push('base_price = ?');
    values.push(data.base_price);
  }
  if (data.labor_hours !== undefined) {
    fields.push('labor_hours = ?');
    values.push(data.labor_hours);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return findServicePriceById(id);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  execute(`UPDATE service_prices SET ${fields.join(', ')} WHERE id = ?`, values);
  return findServicePriceById(id);
}

export function deleteServicePrice(id: string): boolean {
  const count = execute('DELETE FROM service_prices WHERE id = ?', [id]);
  return count > 0;
}

// Labor Rates

export function findAllLaborRates(): LaborRate[] {
  return query<LaborRate>('SELECT * FROM labor_rates ORDER BY is_default DESC, name ASC', []);
}

export function findLaborRateById(id: string): LaborRate | null {
  return queryOne<LaborRate>('SELECT * FROM labor_rates WHERE id = ?', [id]);
}

export function findDefaultLaborRate(): LaborRate | null {
  return queryOne<LaborRate>('SELECT * FROM labor_rates WHERE is_default = 1', []);
}

export function updateLaborRate(id: string, data: UpdateLaborRateRequest): LaborRate | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.rate_per_hour !== undefined) {
    fields.push('rate_per_hour = ?');
    values.push(data.rate_per_hour);
  }
  if (data.is_default !== undefined) {
    // If setting as default, unset all others first
    if (data.is_default) {
      execute('UPDATE labor_rates SET is_default = 0', []);
    }
    fields.push('is_default = ?');
    values.push(data.is_default ? 1 : 0);
  }

  if (fields.length === 0) {
    return findLaborRateById(id);
  }

  values.push(id);
  execute(`UPDATE labor_rates SET ${fields.join(', ')} WHERE id = ?`, values);
  return findLaborRateById(id);
}

export function createLaborRate(name: string, rate: number, isDefault = false): LaborRate {
  const id = uuidv4();
  const now = new Date().toISOString();

  if (isDefault) {
    execute('UPDATE labor_rates SET is_default = 0', []);
  }

  execute(
    `INSERT INTO labor_rates (id, name, rate_per_hour, is_default, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, rate, isDefault ? 1 : 0, now]
  );

  return findLaborRateById(id)!;
}
