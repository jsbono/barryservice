import { query, queryOne, execute } from '../config/db.js';
import { Part, CreatePartRequest, UpdatePartRequest } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export function findAll(limit = 100, offset = 0): Part[] {
  return query<Part>(
    'SELECT * FROM parts WHERE is_active = 1 ORDER BY name ASC LIMIT ? OFFSET ?',
    [limit, offset]
  );
}

export function findById(id: string): Part | null {
  return queryOne<Part>('SELECT * FROM parts WHERE id = ?', [id]);
}

export function findBySku(sku: string): Part | null {
  return queryOne<Part>('SELECT * FROM parts WHERE sku = ?', [sku]);
}

export function search(searchTerm: string, limit = 50): Part[] {
  const term = `%${searchTerm}%`;
  return query<Part>(
    `SELECT * FROM parts
     WHERE is_active = 1 AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)
     ORDER BY name ASC LIMIT ?`,
    [term, term, term, limit]
  );
}

export function create(data: CreatePartRequest): Part {
  const id = uuidv4();
  const now = new Date().toISOString();
  execute(
    `INSERT INTO parts (id, sku, name, description, cost, retail_price, quantity_in_stock, reorder_threshold, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id,
      data.sku,
      data.name,
      data.description || null,
      data.cost,
      data.retail_price,
      data.quantity_in_stock || 0,
      data.reorder_threshold || 5,
      now,
      now,
    ]
  );
  return findById(id)!;
}

export function update(id: string, data: UpdatePartRequest): Part | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.sku !== undefined) {
    fields.push(`sku = ?`);
    values.push(data.sku);
  }
  if (data.name !== undefined) {
    fields.push(`name = ?`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = ?`);
    values.push(data.description);
  }
  if (data.cost !== undefined) {
    fields.push(`cost = ?`);
    values.push(data.cost);
  }
  if (data.retail_price !== undefined) {
    fields.push(`retail_price = ?`);
    values.push(data.retail_price);
  }
  if (data.quantity_in_stock !== undefined) {
    fields.push(`quantity_in_stock = ?`);
    values.push(data.quantity_in_stock);
  }
  if (data.reorder_threshold !== undefined) {
    fields.push(`reorder_threshold = ?`);
    values.push(data.reorder_threshold);
  }
  if (data.is_active !== undefined) {
    fields.push(`is_active = ?`);
    values.push(data.is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(id);

  execute(`UPDATE parts SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function adjustStock(id: string, quantityChange: number): Part | null {
  const part = findById(id);
  if (!part) return null;

  const newQuantity = (part.quantity_in_stock || 0) + quantityChange;
  execute(
    'UPDATE parts SET quantity_in_stock = ?, updated_at = ? WHERE id = ?',
    [newQuantity, new Date().toISOString(), id]
  );
  return findById(id);
}

export function remove(id: string): boolean {
  // Soft delete by setting is_active = 0
  const count = execute('UPDATE parts SET is_active = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), id]);
  return count > 0;
}

export function hardDelete(id: string): boolean {
  const count = execute('DELETE FROM parts WHERE id = ?', [id]);
  return count > 0;
}

export function count(includeInactive = false): number {
  if (includeInactive) {
    const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM parts');
    return result?.count || 0;
  }
  const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM parts WHERE is_active = 1');
  return result?.count || 0;
}

export function getLowStock(): Part[] {
  return query<Part>(
    'SELECT * FROM parts WHERE is_active = 1 AND quantity_in_stock <= reorder_threshold ORDER BY quantity_in_stock ASC'
  );
}
