import PDFDocument from 'pdfkit';

export interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date?: string | null;
  status: string;
  customer: {
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    license_plate?: string | null;
    vin?: string | null;
  };
  service?: {
    service_type: string;
    description?: string | null;
    service_date: string;
    labor_hours?: number | null;
    labor_rate?: number | null;
  };
  parts: Array<{
    name: string;
    part_number?: string;
    quantity: number;
    unit_price: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes?: string | null;
  payment_method?: string | null;
  payment_date?: string | null;
}

interface ShopInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website?: string;
}

// Default shop info - in production this would come from config/database
const DEFAULT_SHOP_INFO: ShopInfo = {
  name: 'Barry Service Auto',
  address: '123 Main Street',
  city: 'Anytown',
  state: 'ST',
  zip: '12345',
  phone: '(555) 123-4567',
  email: 'service@barryservice.com',
  website: 'www.barryservice.com',
};

/**
 * Format a number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate a PDF invoice from invoice data
 */
export async function generateInvoicePDF(
  data: InvoiceData,
  shopInfo: ShopInfo = DEFAULT_SHOP_INFO
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Invoice ${data.invoice_number}`,
          Author: shopInfo.name,
          Subject: 'Service Invoice',
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - Shop Info
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(shopInfo.name, { align: 'left' });

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(shopInfo.address)
        .text(`${shopInfo.city}, ${shopInfo.state} ${shopInfo.zip}`)
        .text(`Phone: ${shopInfo.phone}`)
        .text(`Email: ${shopInfo.email}`);

      if (shopInfo.website) {
        doc.text(`Web: ${shopInfo.website}`);
      }

      // Invoice title and number
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .text('INVOICE', 400, 50, { width: 150, align: 'right' });

      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`#${data.invoice_number}`, 400, 85, { width: 150, align: 'right' });

      // Status badge
      const statusColors: Record<string, string> = {
        draft: '#6B7280',
        sent: '#3B82F6',
        paid: '#10B981',
        overdue: '#EF4444',
        cancelled: '#9CA3AF',
      };
      const statusColor = statusColors[data.status] || '#6B7280';

      doc
        .fillColor(statusColor)
        .roundedRect(450, 105, 80, 20, 3)
        .fill();

      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(data.status.toUpperCase(), 450, 110, { width: 80, align: 'center' });

      doc.fillColor('#000000');

      // Dates
      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`Date: ${formatDate(data.created_at)}`, 400, 140, { width: 150, align: 'right' });

      if (data.due_date) {
        doc.text(`Due: ${formatDate(data.due_date)}`, { width: 150, align: 'right' });
      }

      // Horizontal line
      doc
        .moveTo(50, 175)
        .lineTo(562, 175)
        .stroke();

      // Bill To section
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('BILL TO:', 50, 195);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`${data.customer.first_name} ${data.customer.last_name}`, 50, 215);

      if (data.customer.address) {
        doc.text(data.customer.address);
      }
      if (data.customer.city || data.customer.state || data.customer.zip_code) {
        doc.text(
          [data.customer.city, data.customer.state, data.customer.zip_code]
            .filter(Boolean)
            .join(', ')
        );
      }
      if (data.customer.phone) {
        doc.text(`Phone: ${data.customer.phone}`);
      }
      if (data.customer.email) {
        doc.text(`Email: ${data.customer.email}`);
      }

      // Vehicle Info
      if (data.vehicle) {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('VEHICLE:', 300, 195);

        doc
          .font('Helvetica')
          .fontSize(11)
          .text(`${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`, 300, 215);

        if (data.vehicle.license_plate) {
          doc.text(`Plate: ${data.vehicle.license_plate}`);
        }
        if (data.vehicle.vin) {
          doc.text(`VIN: ${data.vehicle.vin}`);
        }
      }

      // Service Info
      let currentY = 310;
      if (data.service) {
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('SERVICE DETAILS:', 50, currentY);

        currentY += 20;
        doc
          .font('Helvetica')
          .fontSize(11)
          .text(`Service: ${data.service.service_type}`, 50, currentY);

        currentY += 15;
        if (data.service.description) {
          doc.text(`Description: ${data.service.description}`, 50, currentY, { width: 500 });
          currentY += 15 + Math.ceil(data.service.description.length / 80) * 12;
        }

        doc.text(`Service Date: ${formatDate(data.service.service_date)}`, 50, currentY);
        currentY += 25;
      }

      // Line Items Table
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('LINE ITEMS:', 50, currentY);

      currentY += 20;

      // Table header
      const tableTop = currentY;
      const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
      const tableWidths = [280, 50, 90, 90];
      const tableX = [50, 330, 380, 470];

      // Header background
      doc
        .fillColor('#F3F4F6')
        .rect(50, tableTop, 512, 20)
        .fill();

      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .fontSize(10);

      tableHeaders.forEach((header, i) => {
        doc.text(header, tableX[i], tableTop + 5, { width: tableWidths[i], align: i === 0 ? 'left' : 'right' });
      });

      currentY = tableTop + 25;

      // Table rows
      doc.font('Helvetica').fontSize(10);

      // Labor row
      if (data.service && data.service.labor_hours && data.service.labor_rate) {
        const laborTotal = data.service.labor_hours * data.service.labor_rate;
        doc.text('Labor', tableX[0], currentY, { width: tableWidths[0] });
        doc.text(data.service.labor_hours.toString(), tableX[1], currentY, { width: tableWidths[1], align: 'right' });
        doc.text(formatCurrency(data.service.labor_rate) + '/hr', tableX[2], currentY, { width: tableWidths[2], align: 'right' });
        doc.text(formatCurrency(laborTotal), tableX[3], currentY, { width: tableWidths[3], align: 'right' });
        currentY += 18;
      }

      // Parts rows
      data.parts.forEach((part) => {
        const lineTotal = part.quantity * part.unit_price;
        const description = part.part_number
          ? `${part.name} (${part.part_number})`
          : part.name;

        doc.text(description, tableX[0], currentY, { width: tableWidths[0] });
        doc.text(part.quantity.toString(), tableX[1], currentY, { width: tableWidths[1], align: 'right' });
        doc.text(formatCurrency(part.unit_price), tableX[2], currentY, { width: tableWidths[2], align: 'right' });
        doc.text(formatCurrency(lineTotal), tableX[3], currentY, { width: tableWidths[3], align: 'right' });
        currentY += 18;
      });

      // Table bottom line
      doc
        .moveTo(50, currentY)
        .lineTo(562, currentY)
        .stroke();

      currentY += 15;

      // Totals section
      const totalsX = 380;
      const totalsValueX = 470;
      const totalsWidth = 90;

      doc
        .font('Helvetica')
        .fontSize(11)
        .text('Subtotal:', totalsX, currentY)
        .text(formatCurrency(data.subtotal), totalsValueX, currentY, { width: totalsWidth, align: 'right' });

      currentY += 18;

      if (data.tax_rate > 0) {
        doc
          .text(`Tax (${(data.tax_rate * 100).toFixed(1)}%):`, totalsX, currentY)
          .text(formatCurrency(data.tax_amount), totalsValueX, currentY, { width: totalsWidth, align: 'right' });
        currentY += 18;
      }

      if (data.discount_amount > 0) {
        doc
          .text('Discount:', totalsX, currentY)
          .text(`-${formatCurrency(data.discount_amount)}`, totalsValueX, currentY, { width: totalsWidth, align: 'right' });
        currentY += 18;
      }

      // Total with emphasis
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('TOTAL:', totalsX, currentY)
        .text(formatCurrency(data.total), totalsValueX, currentY, { width: totalsWidth, align: 'right' });

      currentY += 30;

      // Payment info (if paid)
      if (data.status === 'paid' && data.payment_date) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#10B981')
          .text(`Paid on ${formatDate(data.payment_date)}`, totalsX, currentY);

        if (data.payment_method) {
          doc.text(`via ${data.payment_method}`);
        }
        doc.fillColor('#000000');
        currentY += 30;
      }

      // Notes section
      if (data.notes) {
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('Notes:', 50, currentY);

        currentY += 15;
        doc
          .font('Helvetica')
          .fontSize(10)
          .text(data.notes, 50, currentY, { width: 512 });

        currentY += 40;
      }

      // Footer
      const footerY = 720;
      doc
        .moveTo(50, footerY)
        .lineTo(562, footerY)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#6B7280')
        .text(
          'Thank you for your business!',
          50,
          footerY + 10,
          { align: 'center', width: 512 }
        )
        .text(
          'Payment is due within 30 days. Please include invoice number with payment.',
          50,
          footerY + 22,
          { align: 'center', width: 512 }
        );

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a simple receipt PDF (shorter format)
 */
export async function generateReceiptPDF(
  data: InvoiceData,
  shopInfo: ShopInfo = DEFAULT_SHOP_INFO
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Use narrower page for receipt
      const doc = new PDFDocument({
        size: [280, 600],
        margin: 20,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Shop name
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(shopInfo.name, { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(8)
        .text(shopInfo.address, { align: 'center' })
        .text(`${shopInfo.city}, ${shopInfo.state} ${shopInfo.zip}`, { align: 'center' })
        .text(shopInfo.phone, { align: 'center' });

      doc.moveDown();

      // Receipt title
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('RECEIPT', { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`#${data.invoice_number}`, { align: 'center' })
        .text(formatDate(data.created_at), { align: 'center' });

      doc.moveDown();

      // Dashed line
      doc.text('-'.repeat(40), { align: 'center' });

      // Customer
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`Customer: ${data.customer.first_name} ${data.customer.last_name}`);

      // Vehicle
      if (data.vehicle) {
        doc.text(`Vehicle: ${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`);
      }

      doc.moveDown();
      doc.text('-'.repeat(40), { align: 'center' });

      // Items
      if (data.service && data.service.labor_hours && data.service.labor_rate) {
        const laborTotal = data.service.labor_hours * data.service.labor_rate;
        doc.text(`Labor (${data.service.labor_hours}hr)`);
        doc.text(`  ${formatCurrency(laborTotal)}`, { align: 'right' });
      }

      data.parts.forEach((part) => {
        const lineTotal = part.quantity * part.unit_price;
        doc.text(`${part.name} x${part.quantity}`);
        doc.text(`  ${formatCurrency(lineTotal)}`, { align: 'right' });
      });

      doc.moveDown();
      doc.text('-'.repeat(40), { align: 'center' });

      // Totals
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`Subtotal: ${formatCurrency(data.subtotal)}`, { align: 'right' });

      if (data.tax_amount > 0) {
        doc.text(`Tax: ${formatCurrency(data.tax_amount)}`, { align: 'right' });
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(`TOTAL: ${formatCurrency(data.total)}`, { align: 'right' });

      doc.moveDown();

      if (data.status === 'paid') {
        doc
          .font('Helvetica')
          .fontSize(9)
          .text('*** PAID ***', { align: 'center' });
      }

      doc.moveDown(2);
      doc
        .font('Helvetica')
        .fontSize(8)
        .text('Thank you for your business!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
