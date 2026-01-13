import PDFDocument from 'pdfkit';
import * as InvoiceModel from '../models/Invoice.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as VehicleModel from '../models/Vehicle.js';
import * as CustomerModel from '../models/Customer.js';
import * as PartModel from '../models/Part.js';
import {
  ServiceRecordForInvoice,
  Invoice,
  InvoiceWithDetails,
  CreateInvoiceLineItemRequest,
  Customer,
  Vehicle,
  ServiceLog,
} from '../models/types.js';
import { sendEmail } from './emailService.js';

// Company configuration - in production, this would come from config/database
const COMPANY_CONFIG = {
  name: 'MotorAI',
  address: '123 Main Street',
  city: 'Anytown',
  state: 'ST',
  zip: '12345',
  phone: '(555) 123-4567',
  email: 'service@motorai.com',
  website: 'www.motorai.com',
  taxId: 'XX-XXXXXXX',
};

// Default rates - in production, this would come from config/database
const DEFAULT_HOURLY_RATE = 95.0;
const DEFAULT_TAX_RATE = 0.0825; // 8.25%

export interface InvoiceGenerationResult {
  invoice: Invoice;
  pdfBase64: string;
}

/**
 * Generate an invoice from a service record
 */
export async function generateInvoiceFromServiceRecord(
  data: ServiceRecordForInvoice
): Promise<InvoiceGenerationResult> {
  // Get the service log
  const serviceLog = ServiceLogModel.findById(data.service_log_id);
  if (!serviceLog) {
    throw new Error(`Service log not found: ${data.service_log_id}`);
  }

  // Get the vehicle
  const vehicle = VehicleModel.findById(serviceLog.vehicle_id);
  if (!vehicle) {
    throw new Error(`Vehicle not found: ${serviceLog.vehicle_id}`);
  }

  // Get the customer
  const customer = CustomerModel.findById(vehicle.customer_id);
  if (!customer) {
    throw new Error(`Customer not found: ${vehicle.customer_id}`);
  }

  // Check if invoice already exists for this service log
  const existingInvoice = InvoiceModel.findByServiceLogId(data.service_log_id);
  if (existingInvoice) {
    throw new Error(`Invoice already exists for service log: ${data.service_log_id}`);
  }

  // Calculate labor cost
  const hourlyRate = data.hourly_rate || DEFAULT_HOURLY_RATE;
  const laborCost = data.labor_hours * hourlyRate;

  // Build line items
  const lineItems: CreateInvoiceLineItemRequest[] = [];

  // Add labor line item
  if (data.labor_hours > 0) {
    lineItems.push({
      line_type: 'labor',
      description: `${serviceLog.service_type.replace(/_/g, ' ')} - Labor`,
      quantity: data.labor_hours,
      unit_price: hourlyRate,
      total_price: laborCost,
      labor_hours: data.labor_hours,
    });
  }

  // Add parts line items
  let partsCost = 0;
  for (const partEntry of data.parts) {
    const part = PartModel.findById(partEntry.part_id);
    if (!part) {
      throw new Error(`Part not found: ${partEntry.part_id}`);
    }

    const partTotal = part.retail_price * partEntry.quantity;
    partsCost += partTotal;

    lineItems.push({
      line_type: 'part',
      description: `${part.name} (${part.sku})`,
      quantity: partEntry.quantity,
      unit_price: part.retail_price,
      total_price: partTotal,
      part_id: part.id,
    });
  }

  // Calculate totals
  const subtotal = laborCost + partsCost;
  const taxRate = data.tax_rate !== undefined ? data.tax_rate : DEFAULT_TAX_RATE;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Create the invoice
  const invoice = InvoiceModel.create({
    customer_id: customer.id,
    vehicle_id: vehicle.id,
    service_log_id: serviceLog.id,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_rate: taxRate,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    notes: data.notes,
    payment_terms: data.payment_terms || 30,
    line_items: lineItems,
  });

  // Get full invoice with details for PDF generation
  const invoiceWithDetails = InvoiceModel.findByIdWithDetails(invoice.id);
  if (!invoiceWithDetails) {
    throw new Error('Failed to retrieve created invoice');
  }

  // Generate PDF
  const pdfBase64 = await generatePdfBase64(invoiceWithDetails);

  // Update invoice with PDF data
  InvoiceModel.updatePdfData(invoice.id, pdfBase64);

  return {
    invoice: InvoiceModel.findById(invoice.id)!,
    pdfBase64,
  };
}

/**
 * Regenerate PDF for an existing invoice
 */
export async function regeneratePdf(invoiceId: string): Promise<string> {
  const invoice = InvoiceModel.findByIdWithDetails(invoiceId);
  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  const pdfBase64 = await generatePdfBase64(invoice);
  InvoiceModel.updatePdfData(invoiceId, pdfBase64);

  return pdfBase64;
}

/**
 * Generate PDF as base64 string
 */
export async function generatePdfBase64(invoice: InvoiceWithDetails): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      bufferPages: true,
    });

    // Collect PDF data into buffer
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Resolve when PDF is complete
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer.toString('base64'));
    });

    // Handle errors
    doc.on('error', reject);

    // Build PDF content
    buildPdfContent(doc, invoice);

    // Finalize the PDF
    doc.end();
  });
}

/**
 * Get PDF buffer from base64 string
 */
export function getPdfBuffer(pdfBase64: string): Buffer {
  return Buffer.from(pdfBase64, 'base64');
}

/**
 * Build the PDF document content
 */
function buildPdfContent(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails): void {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Company Header
  drawCompanyHeader(doc, pageWidth);

  // Invoice title and number
  doc.moveDown(2);
  doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text(`Invoice #: ${invoice.invoice_number}`, { align: 'center' });
  doc.text(`Date: ${formatDate(invoice.invoice_date || invoice.created_at)}`, { align: 'center' });
  doc.text(`Due Date: ${formatDate(invoice.due_date || invoice.created_at)}`, { align: 'center' });

  // Horizontal line
  doc.moveDown(1);
  drawHorizontalLine(doc, pageWidth);

  // Bill To / Vehicle Info section
  doc.moveDown(1);
  const sectionY = doc.y;

  // Bill To (left side)
  doc.fontSize(10).font('Helvetica-Bold').text('BILL TO:', doc.page.margins.left, sectionY);
  doc.font('Helvetica');
  if (invoice.customer) {
    doc.text(invoice.customer.name);
    if (invoice.customer.email) doc.text(invoice.customer.email);
    if (invoice.customer.phone) doc.text(invoice.customer.phone);
  }

  // Vehicle Info (right side)
  const rightColumnX = doc.page.margins.left + pageWidth / 2;
  doc.fontSize(10).font('Helvetica-Bold').text('VEHICLE:', rightColumnX, sectionY);
  doc.font('Helvetica');
  if (invoice.vehicle) {
    doc.text(`${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`, rightColumnX);
    if (invoice.vehicle.vin) doc.text(`VIN: ${invoice.vehicle.vin}`, rightColumnX);
    if (invoice.vehicle.mileage) doc.text(`Mileage: ${invoice.vehicle.mileage.toLocaleString()}`, rightColumnX);
  }

  // Service info
  if (invoice.service_log) {
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('SERVICE PERFORMED:');
    doc.font('Helvetica').text(invoice.service_log.service_type.replace(/_/g, ' '));
    if (invoice.service_log.notes) {
      doc.text(`Notes: ${invoice.service_log.notes}`);
    }
  }

  // Line items table
  doc.moveDown(2);
  drawLineItemsTable(doc, invoice, pageWidth);

  // Totals
  doc.moveDown(2);
  drawTotals(doc, invoice, pageWidth);

  // Payment terms and notes
  doc.moveDown(2);
  drawPaymentTerms(doc, invoice, pageWidth);

  // Footer
  drawFooter(doc, pageWidth);
}

/**
 * Draw company header
 */
function drawCompanyHeader(doc: PDFKit.PDFDocument, pageWidth: number): void {
  doc.fontSize(20).font('Helvetica-Bold').text(COMPANY_CONFIG.name, { align: 'center' });
  doc.fontSize(10).font('Helvetica');
  doc.text(COMPANY_CONFIG.address, { align: 'center' });
  doc.text(`${COMPANY_CONFIG.city}, ${COMPANY_CONFIG.state} ${COMPANY_CONFIG.zip}`, { align: 'center' });
  doc.text(`Phone: ${COMPANY_CONFIG.phone} | Email: ${COMPANY_CONFIG.email}`, { align: 'center' });
}

/**
 * Draw horizontal line
 */
function drawHorizontalLine(doc: PDFKit.PDFDocument, pageWidth: number): void {
  const startX = doc.page.margins.left;
  const endX = startX + pageWidth;
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(startX, doc.y)
    .lineTo(endX, doc.y)
    .stroke();
}

/**
 * Draw line items table
 */
function drawLineItemsTable(
  doc: PDFKit.PDFDocument,
  invoice: InvoiceWithDetails,
  pageWidth: number
): void {
  const startX = doc.page.margins.left;
  const colWidths = {
    description: pageWidth * 0.45,
    quantity: pageWidth * 0.15,
    unitPrice: pageWidth * 0.2,
    total: pageWidth * 0.2,
  };

  // Table header
  const headerY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold');
  doc.rect(startX, headerY - 3, pageWidth, 18).fill('#f0f0f0');
  doc.fillColor('#000000');

  let currentX = startX + 5;
  doc.text('Description', currentX, headerY, { width: colWidths.description - 10 });
  currentX += colWidths.description;
  doc.text('Qty', currentX, headerY, { width: colWidths.quantity - 10, align: 'center' });
  currentX += colWidths.quantity;
  doc.text('Unit Price', currentX, headerY, { width: colWidths.unitPrice - 10, align: 'right' });
  currentX += colWidths.unitPrice;
  doc.text('Total', currentX, headerY, { width: colWidths.total - 10, align: 'right' });

  doc.moveDown(1.5);

  // Table rows
  doc.font('Helvetica');

  // Labor items
  const laborItems = invoice.line_items.filter((item) => item.line_type === 'labor');
  if (laborItems.length > 0) {
    doc.fontSize(9).font('Helvetica-Bold').text('Labor:', startX + 5);
    doc.font('Helvetica');
    for (const item of laborItems) {
      drawLineItem(doc, item, startX, colWidths);
    }
    doc.moveDown(0.5);
  }

  // Parts items
  const partItems = invoice.line_items.filter((item) => item.line_type === 'part');
  if (partItems.length > 0) {
    doc.fontSize(9).font('Helvetica-Bold').text('Parts:', startX + 5);
    doc.font('Helvetica');
    for (const item of partItems) {
      drawLineItem(doc, item, startX, colWidths);
    }
  }
}

/**
 * Draw a single line item row
 */
function drawLineItem(
  doc: PDFKit.PDFDocument,
  item: InvoiceWithDetails['line_items'][0],
  startX: number,
  colWidths: { description: number; quantity: number; unitPrice: number; total: number }
): void {
  const y = doc.y;
  let currentX = startX + 10;

  doc.fontSize(9);
  doc.text(item.description, currentX, y, { width: colWidths.description - 15 });
  currentX += colWidths.description;

  const qtyText = item.line_type === 'labor' && item.labor_hours
    ? `${item.labor_hours} hrs`
    : item.quantity.toString();
  doc.text(qtyText, currentX, y, { width: colWidths.quantity - 10, align: 'center' });
  currentX += colWidths.quantity;

  doc.text(formatCurrency(item.unit_price), currentX, y, { width: colWidths.unitPrice - 10, align: 'right' });
  currentX += colWidths.unitPrice;

  doc.text(formatCurrency(item.total_price), currentX, y, { width: colWidths.total - 10, align: 'right' });

  doc.moveDown(0.8);
}

/**
 * Draw totals section
 */
function drawTotals(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails, pageWidth: number): void {
  const startX = doc.page.margins.left + pageWidth * 0.6;
  const labelWidth = pageWidth * 0.2;
  const valueWidth = pageWidth * 0.2;

  // Horizontal line above totals
  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(startX, doc.y)
    .lineTo(startX + labelWidth + valueWidth, doc.y)
    .stroke();
  doc.moveDown(0.5);

  // Subtotal - calculate from labor_total + parts_total or use subtotal field
  const subtotal = invoice.subtotal || (invoice.labor_total + invoice.parts_total);
  const taxRate = invoice.tax_rate || 0.0825;
  const taxAmount = invoice.tax || (subtotal * taxRate);

  doc.fontSize(10).font('Helvetica');
  let y = doc.y;
  doc.text('Subtotal:', startX, y, { width: labelWidth });
  doc.text(formatCurrency(subtotal), startX + labelWidth, y, { width: valueWidth, align: 'right' });

  // Tax
  doc.moveDown(0.5);
  y = doc.y;
  doc.text(`Tax (${(taxRate * 100).toFixed(2)}%):`, startX, y, { width: labelWidth });
  doc.text(formatCurrency(taxAmount), startX + labelWidth, y, { width: valueWidth, align: 'right' });

  // Total
  doc.moveDown(0.5);
  doc
    .strokeColor('#000000')
    .lineWidth(1)
    .moveTo(startX, doc.y)
    .lineTo(startX + labelWidth + valueWidth, doc.y)
    .stroke();
  doc.moveDown(0.3);

  y = doc.y;
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('TOTAL:', startX, y, { width: labelWidth });
  doc.text(formatCurrency(invoice.total), startX + labelWidth, y, { width: valueWidth, align: 'right' });
}

/**
 * Draw payment terms and notes
 */
function drawPaymentTerms(doc: PDFKit.PDFDocument, invoice: InvoiceWithDetails, pageWidth: number): void {
  const startX = doc.page.margins.left;

  const paymentTerms = invoice.payment_terms || 30;
  doc.fontSize(10).font('Helvetica-Bold').text('Payment Terms:', startX);
  doc.font('Helvetica').text(`Net ${paymentTerms} days. Payment due by ${formatDate(invoice.due_date || invoice.created_at)}.`);

  if (invoice.notes) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Notes:');
    doc.font('Helvetica').text(invoice.notes);
  }

  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Payment Methods Accepted:');
  doc.font('Helvetica').text('Cash, Check, Credit Card, Debit Card');
}

/**
 * Draw footer
 */
function drawFooter(doc: PDFKit.PDFDocument, pageWidth: number): void {
  const footerY = doc.page.height - doc.page.margins.bottom - 30;

  doc
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(doc.page.margins.left, footerY)
    .lineTo(doc.page.margins.left + pageWidth, footerY)
    .stroke();

  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text(
    'Thank you for your business! If you have any questions about this invoice, please contact us.',
    doc.page.margins.left,
    footerY + 10,
    { align: 'center', width: pageWidth }
  );
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Email invoice to customer
 */
export async function emailInvoiceToCustomer(invoiceId: string): Promise<boolean> {
  const invoice = InvoiceModel.findByIdWithDetails(invoiceId);
  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  if (!invoice.customer) {
    throw new Error('Invoice has no associated customer');
  }

  if (!invoice.customer.email) {
    throw new Error('Customer has no email address');
  }

  // Regenerate PDF if not present
  let pdfBase64 = invoice.pdf_data;
  if (!pdfBase64) {
    pdfBase64 = await regeneratePdf(invoiceId);
  }

  const vehicleInfo = invoice.vehicle
    ? `${invoice.vehicle.year} ${invoice.vehicle.make} ${invoice.vehicle.model}`
    : 'your vehicle';

  const invoicePaymentTerms = invoice.payment_terms || 30;
  const subject = `Invoice ${invoice.invoice_number} from ${COMPANY_CONFIG.name}`;
  const text = `
Dear ${invoice.customer.name},

Please find attached your invoice ${invoice.invoice_number} for service on ${vehicleInfo}.

Invoice Summary:
- Invoice Number: ${invoice.invoice_number}
- Invoice Date: ${formatDate(invoice.invoice_date || invoice.created_at)}
- Due Date: ${formatDate(invoice.due_date || invoice.created_at)}
- Total Amount: ${formatCurrency(invoice.total)}

Payment is due within ${invoicePaymentTerms} days.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

${COMPANY_CONFIG.name}
${COMPANY_CONFIG.phone}
${COMPANY_CONFIG.email}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .invoice-summary { background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .total { font-size: 1.2em; font-weight: bold; color: #2563eb; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${COMPANY_CONFIG.name}</h2>
      <p>Invoice ${invoice.invoice_number}</p>
    </div>
    <div class="content">
      <p>Dear ${invoice.customer.name},</p>
      <p>Please find attached your invoice for service on <strong>${vehicleInfo}</strong>.</p>

      <div class="invoice-summary">
        <h3>Invoice Summary</h3>
        <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
        <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoice_date || invoice.created_at)}</p>
        <p><strong>Due Date:</strong> ${formatDate(invoice.due_date || invoice.created_at)}</p>
        <p class="total"><strong>Total Amount:</strong> ${formatCurrency(invoice.total)}</p>
      </div>

      <p>Payment is due within ${invoicePaymentTerms} days.</p>
      <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
      <p>Thank you for your business!</p>
    </div>
    <div class="footer">
      <p>${COMPANY_CONFIG.name}</p>
      <p>${COMPANY_CONFIG.phone} | ${COMPANY_CONFIG.email}</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const success = sendEmail({
    to: invoice.customer.email,
    subject,
    text,
    html,
  });

  if (success) {
    InvoiceModel.markAsSent(invoiceId);
  }

  return success;
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: CreateInvoiceLineItemRequest[],
  taxRate: number = DEFAULT_TAX_RATE
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total_price, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
