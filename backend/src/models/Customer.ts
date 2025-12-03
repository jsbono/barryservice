import { query, queryOne, execute } from '../config/db.js';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export function findAll(limit = 100, offset = 0): Customer[] {
  return query<Customer>(
    'SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

export function findById(id: string): Customer | null {
  return queryOne<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
}

export function findByEmail(email: string): Customer | null {
  return queryOne<Customer>('SELECT * FROM customers WHERE email = ?', [email]);
}

export function create(data: CreateCustomerRequest): Customer {
  const id = uuidv4();
  const now = new Date().toISOString();
  execute(
    `INSERT INTO customers (id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?)`,
    [id, data.name, data.email, data.phone || null, now]
  );
  return findById(id)!;
}

export function update(id: string, data: UpdateCustomerRequest): Customer | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push(`name = ?`);
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push(`email = ?`);
    values.push(data.email);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = ?`);
    values.push(data.phone);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  values.push(id);
  execute(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function remove(id: string): boolean {
  const count = execute('DELETE FROM customers WHERE id = ?', [id]);
  return count > 0;
}

export function count(): number {
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM customers');
  return result?.count || 0;
}
