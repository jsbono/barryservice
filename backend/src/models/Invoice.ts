import { query, queryOne, execute } from '../config/db.js';
import {
  Invoice,
  InvoiceLineItem,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceWithDetails,
  InvoiceStatus,
} from './types.js';
import { v4 as uuidv4 } from 'uuid';
import * as CustomerModel from './Customer.js';
import * as VehicleModel from './Vehicle.js';
import * as ServiceLogModel from './ServiceLog.js';

export function findAll(
  filters: {
    status?: InvoiceStatus;
    customer_id?: string;
    start_date?: string;
    end_date?: string;
  } = {},
  limit = 100,
  offset = 0
): Invoice[] {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.customer_id) {
    conditions.push('customer_id = ?');
    params.push(filters.customer_id);
  }
  if (filters.start_date) {
    conditions.push('(invoice_date >= ? OR created_at >= ?)');
    params.push(filters.start_date, filters.start_date);
  }
  if (filters.end_date) {
    conditions.push('(invoice_date <= ? OR created_at <= ?)');
    params.push(filters.end_date, filters.end_date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  return query<Invoice>(
    `SELECT * FROM invoices ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );
}

export function findById(id: string): Invoice | null {
  return queryOne<Invoice>('SELECT * FROM invoices WHERE id = ?', [id]);
}

export function findByInvoiceNumber(invoiceNumber: string): Invoice | null {
  return queryOne<Invoice>('SELECT * FROM invoices WHERE invoice_number = ?', [invoiceNumber]);
}

export function findByIdWithDetails(id: string): InvoiceWithDetails | null {
  const invoice = findById(id);
  if (!invoice) return null;

  const lineItems = findLineItemsByInvoiceId(id);
  const customer = CustomerModel.findById(invoice.customer_id);
  const vehicle = invoice.vehicle_id ? VehicleModel.findById(invoice.vehicle_id) : null;
  const serviceLog = invoice.service_log_id ? ServiceLogModel.findById(invoice.service_log_id) : null;

  return {
    ...invoice,
    line_items: lineItems,
    customer: customer || undefined,
    vehicle: vehicle || undefined,
    service_log: serviceLog || undefined,
  };
}

export function findLineItemsByInvoiceId(invoiceId: string): InvoiceLineItem[] {
  return query<InvoiceLineItem>(
    'SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY line_type ASC, description ASC',
    [invoiceId]
  );
}

export function findByServiceLogId(serviceLogId: string): Invoice | null {
  return queryOne<Invoice>('SELECT * FROM invoices WHERE service_log_id = ?', [serviceLogId]);
}

export function findByCustomerId(customerId: string): Invoice[] {
  return query<Invoice>(
    'SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );
}

export function generateInvoiceNumber(): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  // Find the highest sequence number for today
  const result = queryOne<{ max_seq: number }>(
    `SELECT MAX(CAST(SUBSTR(invoice_number, -4) AS INTEGER)) as max_seq
     FROM invoices
     WHERE invoice_number LIKE ?`,
    [`INV-${dateStr}-%`]
  );

  const nextSeq = (result?.max_seq || 0) + 1;
  return `INV-${dateStr}-${nextSeq.toString().padStart(4, '0')}`;
}

export function create(data: CreateInvoiceRequest): Invoice {
  const id = uuidv4();
  const now = new Date().toISOString();
  const invoiceNumber = generateInvoiceNumber();
  const invoiceDate = data.invoice_date || now.split('T')[0];

  // Calculate due date (default 30 days from invoice date)
  const dueDate = data.due_date || calculateDueDate(invoiceDate, data.payment_terms || 30);

  // Calculate labor and parts totals from line items
  let laborTotal = 0;
  let partsTotal = 0;
  if (data.line_items) {
    for (const item of data.line_items) {
      if (item.line_type === 'labor') {
        laborTotal += item.total_price;
      } else {
        partsTotal += item.total_price;
      }
    }
  }

  execute(
    `INSERT INTO invoices (
      id, invoice_number, customer_id, vehicle_id, service_log_id,
      invoice_date, due_date, status, labor_total, parts_total, subtotal,
      tax_rate, tax, total, notes, payment_terms, pdf_data, pdf_url, discount,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      invoiceNumber,
      data.customer_id,
      data.vehicle_id || null,
      data.service_log_id || null,
      invoiceDate,
      dueDate,
      data.status || 'sent',
      laborTotal,
      partsTotal,
      data.subtotal,
      data.tax_rate || 0.0825,
      data.tax_amount || 0,
      data.total,
      data.notes || null,
      data.payment_terms || 30,
      data.pdf_data || null,
      null, // pdf_url (legacy field)
      0, // discount
      now,
      now,
    ]
  );

  // Insert line items
  if (data.line_items && data.line_items.length > 0) {
    for (const item of data.line_items) {
      createLineItem(id, item);
    }
  }

  return findById(id)!;
}

export function createLineItem(
  invoiceId: string,
  item: {
    line_type: 'labor' | 'part';
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    part_id?: string;
    labor_hours?: number;
  }
): InvoiceLineItem {
  const id = uuidv4();
  execute(
    `INSERT INTO invoice_line_items (
      id, invoice_id, line_type, description, quantity, unit_price, total_price, part_id, labor_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      invoiceId,
      item.line_type,
      item.description,
      item.quantity,
      item.unit_price,
      item.total_price,
      item.part_id || null,
      item.labor_hours || null,
    ]
  );
  return queryOne<InvoiceLineItem>('SELECT * FROM invoice_line_items WHERE id = ?', [id])!;
}

export function update(id: string, data: UpdateInvoiceRequest): Invoice | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.status !== undefined) {
    fields.push(`status = ?`);
    values.push(data.status);

    // Update paid_at if status changes to paid
    if (data.status === 'paid') {
      fields.push(`paid_at = ?`);
      values.push(new Date().toISOString());
    }
  }
  if (data.notes !== undefined) {
    fields.push(`notes = ?`);
    values.push(data.notes);
  }
  if (data.due_date !== undefined) {
    fields.push(`due_date = ?`);
    values.push(data.due_date);
  }
  if (data.subtotal !== undefined) {
    fields.push(`subtotal = ?`);
    values.push(data.subtotal);
  }
  if (data.tax_rate !== undefined) {
    fields.push(`tax_rate = ?`);
    values.push(data.tax_rate);
  }
  if (data.tax_amount !== undefined) {
    fields.push(`tax = ?`);
    values.push(data.tax_amount);
  }
  if (data.total !== undefined) {
    fields.push(`total = ?`);
    values.push(data.total);
  }
  if (data.pdf_data !== undefined) {
    fields.push(`pdf_data = ?`);
    values.push(data.pdf_data);
  }
  if (data.sent_at !== undefined) {
    fields.push(`sent_at = ?`);
    values.push(data.sent_at);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = ?`);
  values.push(new Date().toISOString());
  values.push(id);

  execute(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
}

export function updatePdfData(id: string, pdfData: string): Invoice | null {
  execute(
    'UPDATE invoices SET pdf_data = ?, updated_at = ? WHERE id = ?',
    [pdfData, new Date().toISOString(), id]
  );
  return findById(id);
}

export function markAsSent(id: string): Invoice | null {
  const now = new Date().toISOString();
  execute(
    'UPDATE invoices SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?',
    ['sent', now, now, id]
  );
  return findById(id);
}

export function markAsPaid(id: string): Invoice | null {
  const now = new Date().toISOString();
  execute(
    'UPDATE invoices SET status = ?, paid_at = ?, updated_at = ? WHERE id = ?',
    ['paid', now, now, id]
  );
  return findById(id);
}

export function remove(id: string): boolean {
  // Delete line items first
  execute('DELETE FROM invoice_line_items WHERE invoice_id = ?', [id]);
  const count = execute('DELETE FROM invoices WHERE id = ?', [id]);
  return count > 0;
}

export function count(filters: { status?: InvoiceStatus; customer_id?: string } = {}): number {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.customer_id) {
    conditions.push('customer_id = ?');
    params.push(filters.customer_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM invoices ${whereClause}`,
    params
  );
  return result?.count || 0;
}

export function getTotalRevenue(startDate?: string, endDate?: string): number {
  const conditions: string[] = ["status = 'paid'"];
  const params: any[] = [];

  if (startDate) {
    conditions.push('paid_at >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('paid_at <= ?');
    params.push(endDate);
  }

  const result = queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE ${conditions.join(' AND ')}`,
    params
  );
  return result?.total || 0;
}

export function getOverdueInvoices(): Invoice[] {
  const today = new Date().toISOString().split('T')[0];
  return query<Invoice>(
    `SELECT * FROM invoices
     WHERE status IN ('draft', 'sent')
       AND due_date < ?
     ORDER BY due_date ASC`,
    [today]
  );
}

function calculateDueDate(invoiceDate: string, paymentTerms: number): string {
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + paymentTerms);
  return date.toISOString().split('T')[0];
}
