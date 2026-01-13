import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { query, queryOne } from '../config/db.js';
import * as NotificationModel from '../models/Notification.js';
import {
  NotificationType,
  UserType,
  CreateNotificationRequest,
  NotificationWithMeta
} from '../models/Notification.js';
import * as EmailLogModel from '../models/EmailLog.js';

// ============================================================================
// Email Configuration
// ============================================================================

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// ============================================================================
// Email Templates
// ============================================================================

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  vin?: string;
}

interface ServiceReminderTemplateParams {
  customerName: string;
  vehicle: VehicleInfo;
  serviceType: string;
  nextServiceDate?: Date;
  nextServiceMileage?: number;
  daysUntilDue?: number;
  shopName?: string;
  shopPhone?: string;
}

interface InvoiceReadyTemplateParams {
  customerName: string;
  vehicle: VehicleInfo;
  invoiceNumber: string;
  totalAmount: number;
  dueDate?: Date;
  portalUrl?: string;
  shopName?: string;
}

interface OverdueServiceTemplateParams {
  customerName: string;
  vehicle: VehicleInfo;
  serviceType: string;
  dueDate?: Date;
  dueMileage?: number;
  daysOverdue?: number;
  shopName?: string;
  shopPhone?: string;
}

// Base email template wrapper
function wrapEmailTemplate(content: string, shopName: string = 'MotorAI'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2563eb; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 32px 24px; }
    .vehicle-badge { display: inline-block; background-color: #eff6ff; color: #2563eb; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0; }
    .alert-box.urgent { background-color: #fee2e2; border-left-color: #ef4444; }
    .alert-box.success { background-color: #d1fae5; border-left-color: #10b981; }
    .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background-color: #1d4ed8; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .details-table td:first-child { color: #6b7280; width: 40%; }
    .details-table td:last-child { font-weight: 500; }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 14px; color: #6b7280; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${shopName}</h1>
    </div>
    ${content}
  </div>
</body>
</html>
  `.trim();
}

// Service Reminder Email Template
export function buildServiceReminderEmail(params: ServiceReminderTemplateParams): { subject: string; text: string; html: string } {
  const { customerName, vehicle, serviceType, nextServiceDate, nextServiceMileage, daysUntilDue, shopName = 'MotorAI', shopPhone } = params;

  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const serviceTypeFormatted = serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  let urgencyText = '';
  let urgencyClass = '';
  if (daysUntilDue !== undefined) {
    if (daysUntilDue <= 0) {
      urgencyText = 'Service is now due!';
      urgencyClass = 'urgent';
    } else if (daysUntilDue <= 7) {
      urgencyText = `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;
      urgencyClass = 'urgent';
    } else {
      urgencyText = `Due in ${daysUntilDue} days`;
    }
  }

  const datePart = nextServiceDate
    ? nextServiceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const mileagePart = nextServiceMileage
    ? `${nextServiceMileage.toLocaleString()} miles`
    : '';

  const subject = `Service Reminder: ${serviceTypeFormatted} for your ${vehicleStr}`;

  const text = `
Hi ${customerName},

This is a reminder that your ${serviceTypeFormatted} is coming due for your ${vehicleStr}.

${datePart ? `Due Date: ${datePart}` : ''}
${mileagePart ? `Due At: ${mileagePart}` : ''}
${urgencyText ? `\n${urgencyText}` : ''}

Please contact us to schedule your service appointment.
${shopPhone ? `Call us at: ${shopPhone}` : ''}

Thank you for choosing ${shopName}!
  `.trim();

  const html = wrapEmailTemplate(`
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>This is a friendly reminder that your vehicle is due for service soon.</p>

      <div class="vehicle-badge">${vehicleStr}</div>

      ${urgencyText ? `<div class="alert-box ${urgencyClass}"><strong>${urgencyText}</strong></div>` : ''}

      <table class="details-table">
        <tr>
          <td>Service Type</td>
          <td>${serviceTypeFormatted}</td>
        </tr>
        ${datePart ? `<tr><td>Due Date</td><td>${datePart}</td></tr>` : ''}
        ${mileagePart ? `<tr><td>Due At</td><td>${mileagePart}</td></tr>` : ''}
      </table>

      <p>Don't wait until it's too late! Regular maintenance keeps your vehicle running smoothly and prevents costly repairs.</p>

      <a href="mailto:service@example.com" class="cta-button">Schedule Service</a>

      <p>Thank you for choosing ${shopName}!</p>
    </div>
    <div class="footer">
      ${shopPhone ? `<p>Questions? Call us at <a href="tel:${shopPhone}">${shopPhone}</a></p>` : ''}
      <p>This is an automated reminder. If you've already scheduled this service, please disregard this message.</p>
    </div>
  `, shopName);

  return { subject, text, html };
}

// Invoice Ready Email Template
export function buildInvoiceReadyEmail(params: InvoiceReadyTemplateParams): { subject: string; text: string; html: string } {
  const { customerName, vehicle, invoiceNumber, totalAmount, dueDate, portalUrl, shopName = 'MotorAI' } = params;

  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const formattedAmount = totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const dueDateStr = dueDate
    ? dueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const subject = `Invoice #${invoiceNumber} Ready - ${formattedAmount}`;

  const text = `
Hi ${customerName},

Your invoice for service on your ${vehicleStr} is now ready.

Invoice Number: ${invoiceNumber}
Total Amount: ${formattedAmount}
${dueDateStr ? `Due Date: ${dueDateStr}` : ''}

${portalUrl ? `View your invoice online: ${portalUrl}` : ''}

Thank you for your business!

${shopName}
  `.trim();

  const html = wrapEmailTemplate(`
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Your invoice for recent service is now ready.</p>

      <div class="vehicle-badge">${vehicleStr}</div>

      <div class="alert-box success">
        <strong>Invoice #${invoiceNumber}</strong>
      </div>

      <table class="details-table">
        <tr>
          <td>Invoice Number</td>
          <td>${invoiceNumber}</td>
        </tr>
        <tr>
          <td>Total Amount</td>
          <td style="font-size: 18px; color: #2563eb;">${formattedAmount}</td>
        </tr>
        ${dueDateStr ? `<tr><td>Due Date</td><td>${dueDateStr}</td></tr>` : ''}
      </table>

      ${portalUrl ? `<a href="${portalUrl}" class="cta-button">View Invoice</a>` : ''}

      <p>Thank you for choosing ${shopName}!</p>
    </div>
    <div class="footer">
      <p>This invoice was generated automatically. Please contact us if you have any questions.</p>
    </div>
  `, shopName);

  return { subject, text, html };
}

// Overdue Service Alert Email Template
export function buildOverdueServiceEmail(params: OverdueServiceTemplateParams): { subject: string; text: string; html: string } {
  const { customerName, vehicle, serviceType, dueDate, dueMileage, daysOverdue, shopName = 'MotorAI', shopPhone } = params;

  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const serviceTypeFormatted = serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const dueDateStr = dueDate
    ? dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const dueMileageStr = dueMileage ? `${dueMileage.toLocaleString()} miles` : '';

  const subject = `URGENT: ${serviceTypeFormatted} Overdue for your ${vehicleStr}`;

  const text = `
Hi ${customerName},

IMPORTANT: Your ${serviceTypeFormatted} for your ${vehicleStr} is now overdue.

${daysOverdue ? `Days Overdue: ${daysOverdue}` : ''}
${dueDateStr ? `Was Due: ${dueDateStr}` : ''}
${dueMileageStr ? `Was Due At: ${dueMileageStr}` : ''}

Delaying this service could lead to:
- Reduced vehicle performance
- Potential damage to your vehicle
- Higher repair costs in the future

Please schedule your service as soon as possible.
${shopPhone ? `Call us at: ${shopPhone}` : ''}

${shopName}
  `.trim();

  const html = wrapEmailTemplate(`
    <div class="content">
      <p>Hi ${customerName},</p>

      <div class="alert-box urgent">
        <strong>URGENT: Service Overdue</strong>
      </div>

      <p>Your scheduled maintenance for your vehicle is now overdue and requires immediate attention.</p>

      <div class="vehicle-badge">${vehicleStr}</div>

      <table class="details-table">
        <tr>
          <td>Service Type</td>
          <td>${serviceTypeFormatted}</td>
        </tr>
        ${daysOverdue ? `<tr><td>Days Overdue</td><td style="color: #ef4444; font-weight: bold;">${daysOverdue} days</td></tr>` : ''}
        ${dueDateStr ? `<tr><td>Was Due</td><td>${dueDateStr}</td></tr>` : ''}
        ${dueMileageStr ? `<tr><td>Was Due At</td><td>${dueMileageStr}</td></tr>` : ''}
      </table>

      <p><strong>Delaying this service could lead to:</strong></p>
      <ul>
        <li>Reduced vehicle performance</li>
        <li>Potential damage to your vehicle</li>
        <li>Higher repair costs in the future</li>
      </ul>

      <a href="mailto:service@example.com" class="cta-button">Schedule Now</a>

      <p>Don't delay - your vehicle's health depends on regular maintenance!</p>
    </div>
    <div class="footer">
      ${shopPhone ? `<p>Call us immediately at <a href="tel:${shopPhone}">${shopPhone}</a></p>` : ''}
      <p>This is an urgent automated reminder for your vehicle's safety.</p>
    </div>
  `, shopName);

  return { subject, text, html };
}

// Mechanic-facing notification email template
export function buildMechanicNotificationEmail(params: {
  mechanicName: string;
  title: string;
  message: string;
  actionUrl?: string;
  shopName?: string;
}): { subject: string; text: string; html: string } {
  const { mechanicName, title, message, actionUrl, shopName = 'MotorAI' } = params;

  const subject = `[${shopName}] ${title}`;

  const text = `
Hi ${mechanicName},

${title}

${message}

${actionUrl ? `View details: ${actionUrl}` : ''}

${shopName} System Notification
  `.trim();

  const html = wrapEmailTemplate(`
    <div class="content">
      <p>Hi ${mechanicName},</p>

      <div class="alert-box">
        <strong>${title}</strong>
      </div>

      <p>${message.replace(/\n/g, '<br>')}</p>

      ${actionUrl ? `<a href="${actionUrl}" class="cta-button">View Details</a>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated system notification.</p>
    </div>
  `, shopName);

  return { subject, text, html };
}

// ============================================================================
// Email Sending Functions
// ============================================================================

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!config.smtp.user || !config.smtp.pass) {
      console.log('SMTP not configured, skipping email:', params.subject);
      return false;
    }

    await transporter.sendMail({
      from: config.smtp.fromEmail,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log(`Email sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// ============================================================================
// In-App Notification Functions
// ============================================================================

export function createNotification(data: CreateNotificationRequest): NotificationWithMeta {
  return NotificationModel.create(data);
}

export function getNotificationsForUser(
  userId: string,
  userType: UserType,
  options: { type?: NotificationType; unreadOnly?: boolean; limit?: number; offset?: number } = {}
): NotificationWithMeta[] {
  return NotificationModel.findByUser({
    user_id: userId,
    user_type: userType,
    ...options
  });
}

export function markNotificationRead(id: string): NotificationWithMeta | null {
  return NotificationModel.markRead(id);
}

export function markAllNotificationsRead(userId: string, userType: UserType): number {
  return NotificationModel.markAllRead(userId, userType);
}

export function deleteNotification(id: string): boolean {
  return NotificationModel.remove(id);
}

export function getUnreadCount(userId: string, userType: UserType): number {
  return NotificationModel.countUnread(userId, userType);
}

// ============================================================================
// Combined Notification Functions (Email + In-App)
// ============================================================================

interface ServiceDueData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  vehicle: VehicleInfo & { id: string };
  serviceType: string;
  nextServiceDate?: Date;
  nextServiceMileage?: number;
  daysUntilDue?: number;
  serviceLogId?: string;
}

// Send service reminder (email + in-app notification)
export async function sendServiceReminder(data: ServiceDueData): Promise<{ email: boolean; notification: NotificationWithMeta | null }> {
  const { customerId, customerName, customerEmail, vehicle, serviceType, nextServiceDate, nextServiceMileage, daysUntilDue, serviceLogId } = data;

  // Check for recent notification to prevent duplicates
  const recentNotification = NotificationModel.findRecentByType(
    customerId,
    'customer',
    'service_reminder',
    vehicle.id,
    config.reminder.suppressionDays
  );

  if (recentNotification) {
    console.log(`Skipping duplicate service reminder for customer ${customerId}, vehicle ${vehicle.id}`);
    return { email: false, notification: null };
  }

  // Determine notification type based on service
  let notificationType: NotificationType = 'service_reminder';
  const lowerServiceType = serviceType.toLowerCase();
  if (lowerServiceType.includes('oil')) {
    notificationType = 'oil_change_due';
  } else if (lowerServiceType.includes('minor') || lowerServiceType.includes('tune')) {
    notificationType = 'minor_service_due';
  } else if (lowerServiceType.includes('major') || lowerServiceType.includes('transmission') || lowerServiceType.includes('timing')) {
    notificationType = 'major_service_due';
  }

  const serviceTypeFormatted = serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // Create in-app notification
  const notification = NotificationModel.create({
    user_id: customerId,
    user_type: 'customer',
    type: notificationType,
    title: `${serviceTypeFormatted} Due Soon`,
    message: `Your ${vehicleStr} is due for ${serviceTypeFormatted}${daysUntilDue !== undefined ? ` in ${daysUntilDue} days` : ''}.`,
    metadata: {
      vehicle_id: vehicle.id,
      service_type: serviceType,
      next_service_date: nextServiceDate?.toISOString(),
      next_service_mileage: nextServiceMileage,
      days_until_due: daysUntilDue,
      service_log_id: serviceLogId
    }
  });

  // Send email
  const emailContent = buildServiceReminderEmail({
    customerName,
    vehicle,
    serviceType,
    nextServiceDate,
    nextServiceMileage,
    daysUntilDue
  });

  const emailSent = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });

  // Log email if sent and serviceLogId provided
  if (emailSent && serviceLogId) {
    EmailLogModel.create(serviceLogId);
  }

  return { email: emailSent, notification };
}

// Send invoice ready notification (email + in-app)
export async function sendInvoiceReadyNotification(data: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  vehicle: VehicleInfo & { id: string };
  invoiceNumber: string;
  totalAmount: number;
  dueDate?: Date;
  portalUrl?: string;
}): Promise<{ email: boolean; notification: NotificationWithMeta | null }> {
  const { customerId, customerName, customerEmail, vehicle, invoiceNumber, totalAmount, dueDate, portalUrl } = data;

  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const formattedAmount = totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Create in-app notification
  const notification = NotificationModel.create({
    user_id: customerId,
    user_type: 'customer',
    type: 'invoice_ready',
    title: `Invoice #${invoiceNumber} Ready`,
    message: `Your invoice for ${vehicleStr} is ready. Total: ${formattedAmount}`,
    metadata: {
      vehicle_id: vehicle.id,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      due_date: dueDate?.toISOString(),
      portal_url: portalUrl
    }
  });

  // Send email
  const emailContent = buildInvoiceReadyEmail({
    customerName,
    vehicle,
    invoiceNumber,
    totalAmount,
    dueDate,
    portalUrl
  });

  const emailSent = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });

  return { email: emailSent, notification };
}

// Send overdue service alert (email + in-app)
export async function sendOverdueServiceAlert(data: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  vehicle: VehicleInfo & { id: string };
  serviceType: string;
  dueDate?: Date;
  dueMileage?: number;
  daysOverdue?: number;
  serviceLogId?: string;
}): Promise<{ email: boolean; notification: NotificationWithMeta | null }> {
  const { customerId, customerName, customerEmail, vehicle, serviceType, dueDate, dueMileage, daysOverdue, serviceLogId } = data;

  // Check for recent overdue notification to prevent spam
  const recentNotification = NotificationModel.findRecentByType(
    customerId,
    'customer',
    'overdue_service',
    vehicle.id,
    config.reminder.suppressionDays
  );

  if (recentNotification) {
    console.log(`Skipping duplicate overdue alert for customer ${customerId}, vehicle ${vehicle.id}`);
    return { email: false, notification: null };
  }

  const serviceTypeFormatted = serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // Create in-app notification
  const notification = NotificationModel.create({
    user_id: customerId,
    user_type: 'customer',
    type: 'overdue_service',
    title: `${serviceTypeFormatted} Overdue`,
    message: `URGENT: Your ${vehicleStr} is ${daysOverdue ? `${daysOverdue} days ` : ''}overdue for ${serviceTypeFormatted}.`,
    metadata: {
      vehicle_id: vehicle.id,
      service_type: serviceType,
      due_date: dueDate?.toISOString(),
      due_mileage: dueMileage,
      days_overdue: daysOverdue,
      service_log_id: serviceLogId
    }
  });

  // Send email
  const emailContent = buildOverdueServiceEmail({
    customerName,
    vehicle,
    serviceType,
    dueDate,
    dueMileage,
    daysOverdue
  });

  const emailSent = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });

  // Log email if sent and serviceLogId provided
  if (emailSent && serviceLogId) {
    EmailLogModel.create(serviceLogId);
  }

  return { email: emailSent, notification };
}

// ============================================================================
// Scheduler Functions - Check for vehicles with upcoming/overdue services
// ============================================================================

interface ServiceDueRecord {
  service_log_id: string;
  service_type: string;
  next_service_date: string | null;
  next_service_mileage: number | null;
  vehicle_id: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_vin: string | null;
  vehicle_mileage: number | null;
  customer_id: string;
  customer_name: string;
  customer_email: string;
}

// Run daily check for upcoming services
export async function runDailyServiceCheck(): Promise<{
  reminders14Days: number;
  reminders7Days: number;
  remindersDueToday: number;
  overdueAlerts: number;
  errors: number;
}> {
  console.log('Running daily service check...');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate date ranges
  const in14Days = new Date(today);
  in14Days.setDate(today.getDate() + 14);
  const in14DaysStr = in14Days.toISOString().split('T')[0];

  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);
  const in7DaysStr = in7Days.toISOString().split('T')[0];

  const in13Days = new Date(today);
  in13Days.setDate(today.getDate() + 13);
  const in13DaysStr = in13Days.toISOString().split('T')[0];

  const in8Days = new Date(today);
  in8Days.setDate(today.getDate() + 8);
  const in8DaysStr = in8Days.toISOString().split('T')[0];

  let reminders14Days = 0;
  let reminders7Days = 0;
  let remindersDueToday = 0;
  let overdueAlerts = 0;
  let errors = 0;

  // Helper function to get services due in a date range
  const getServicesDueInRange = (startDate: string, endDate: string): ServiceDueRecord[] => {
    return query<ServiceDueRecord>(`
      SELECT
        sl.id as service_log_id,
        sl.service_type,
        sl.next_service_date,
        sl.next_service_mileage,
        v.id as vehicle_id,
        v.year as vehicle_year,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.vin as vehicle_vin,
        v.mileage as vehicle_mileage,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email
      FROM service_logs sl
      JOIN vehicles v ON sl.vehicle_id = v.id
      JOIN customers c ON v.customer_id = c.id
      WHERE sl.next_service_date IS NOT NULL
        AND sl.next_service_date >= ?
        AND sl.next_service_date <= ?
        AND c.email IS NOT NULL
        AND c.email != ''
    `, [startDate, endDate]);
  };

  // 14-day reminders (services due in 13-14 days)
  const services14Days = getServicesDueInRange(in13DaysStr, in14DaysStr);
  for (const service of services14Days) {
    try {
      const dueDate = new Date(service.next_service_date!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      await sendServiceReminder({
        customerId: service.customer_id,
        customerName: service.customer_name,
        customerEmail: service.customer_email,
        vehicle: {
          id: service.vehicle_id,
          year: service.vehicle_year,
          make: service.vehicle_make,
          model: service.vehicle_model,
          vin: service.vehicle_vin || undefined
        },
        serviceType: service.service_type,
        nextServiceDate: dueDate,
        nextServiceMileage: service.next_service_mileage || undefined,
        daysUntilDue,
        serviceLogId: service.service_log_id
      });
      reminders14Days++;
    } catch (error) {
      console.error(`Error sending 14-day reminder for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  // 7-day reminders (services due in 7-8 days)
  const services7Days = getServicesDueInRange(in7DaysStr, in8DaysStr);
  for (const service of services7Days) {
    try {
      const dueDate = new Date(service.next_service_date!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      await sendServiceReminder({
        customerId: service.customer_id,
        customerName: service.customer_name,
        customerEmail: service.customer_email,
        vehicle: {
          id: service.vehicle_id,
          year: service.vehicle_year,
          make: service.vehicle_make,
          model: service.vehicle_model,
          vin: service.vehicle_vin || undefined
        },
        serviceType: service.service_type,
        nextServiceDate: dueDate,
        nextServiceMileage: service.next_service_mileage || undefined,
        daysUntilDue,
        serviceLogId: service.service_log_id
      });
      reminders7Days++;
    } catch (error) {
      console.error(`Error sending 7-day reminder for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  // Due today reminders
  const servicesToday = getServicesDueInRange(todayStr, todayStr);
  for (const service of servicesToday) {
    try {
      const dueDate = new Date(service.next_service_date!);

      await sendServiceReminder({
        customerId: service.customer_id,
        customerName: service.customer_name,
        customerEmail: service.customer_email,
        vehicle: {
          id: service.vehicle_id,
          year: service.vehicle_year,
          make: service.vehicle_make,
          model: service.vehicle_model,
          vin: service.vehicle_vin || undefined
        },
        serviceType: service.service_type,
        nextServiceDate: dueDate,
        nextServiceMileage: service.next_service_mileage || undefined,
        daysUntilDue: 0,
        serviceLogId: service.service_log_id
      });
      remindersDueToday++;
    } catch (error) {
      console.error(`Error sending due-today reminder for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  // Overdue services
  const overdueServices = query<ServiceDueRecord>(`
    SELECT
      sl.id as service_log_id,
      sl.service_type,
      sl.next_service_date,
      sl.next_service_mileage,
      v.id as vehicle_id,
      v.year as vehicle_year,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.vin as vehicle_vin,
      v.mileage as vehicle_mileage,
      c.id as customer_id,
      c.name as customer_name,
      c.email as customer_email
    FROM service_logs sl
    JOIN vehicles v ON sl.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE sl.next_service_date IS NOT NULL
      AND sl.next_service_date < ?
      AND c.email IS NOT NULL
      AND c.email != ''
  `, [todayStr]);

  for (const service of overdueServices) {
    try {
      const dueDate = new Date(service.next_service_date!);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      await sendOverdueServiceAlert({
        customerId: service.customer_id,
        customerName: service.customer_name,
        customerEmail: service.customer_email,
        vehicle: {
          id: service.vehicle_id,
          year: service.vehicle_year,
          make: service.vehicle_make,
          model: service.vehicle_model,
          vin: service.vehicle_vin || undefined
        },
        serviceType: service.service_type,
        dueDate,
        dueMileage: service.next_service_mileage || undefined,
        daysOverdue,
        serviceLogId: service.service_log_id
      });
      overdueAlerts++;
    } catch (error) {
      console.error(`Error sending overdue alert for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  console.log(`Daily service check complete: ${reminders14Days} 14-day, ${reminders7Days} 7-day, ${remindersDueToday} due-today, ${overdueAlerts} overdue, ${errors} errors`);

  return { reminders14Days, reminders7Days, remindersDueToday, overdueAlerts, errors };
}

// Send a test notification (for admin testing)
export async function sendTestNotification(
  userId: string,
  userType: UserType,
  email?: string
): Promise<{ notification: NotificationWithMeta; emailSent: boolean }> {
  // Create test in-app notification
  const notification = NotificationModel.create({
    user_id: userId,
    user_type: userType,
    type: 'service_reminder',
    title: 'Test Notification',
    message: 'This is a test notification from MotorAI. If you received this, notifications are working correctly!',
    metadata: {
      test: true,
      sent_at: new Date().toISOString()
    }
  });

  let emailSent = false;

  // Send test email if email provided
  if (email) {
    emailSent = await sendEmail({
      to: email,
      subject: '[Test] MotorAI Notification Test',
      text: 'This is a test email from MotorAI. If you received this, email notifications are working correctly!',
      html: wrapEmailTemplate(`
        <div class="content">
          <div class="alert-box success">
            <strong>Test Successful!</strong>
          </div>
          <p>This is a test email from MotorAI.</p>
          <p>If you received this, email notifications are working correctly!</p>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
        <div class="footer">
          <p>This is a test notification - no action required.</p>
        </div>
      `)
    });
  }

  return { notification, emailSent };
}

// Clean up old notifications (run periodically)
export function cleanupOldNotifications(daysToKeep: number = 90): number {
  return NotificationModel.deleteOlderThan(daysToKeep);
}
