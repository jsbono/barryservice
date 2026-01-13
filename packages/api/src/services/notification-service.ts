import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type NotificationType = 'service_reminder' | 'invoice' | 'appointment' | 'general';
export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'push';

export interface NotificationRecipient {
  email?: string | null;
  phone?: string | null;
  name: string;
  userId?: string;
}

export interface NotificationPayload {
  type: NotificationType;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
  templateId?: string;
  scheduledFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
}

/**
 * Email templates for different notification types
 */
const EMAIL_TEMPLATES: Record<NotificationType, {
  subject: string;
  htmlTemplate: (data: Record<string, unknown>) => string;
  textTemplate: (data: Record<string, unknown>) => string;
}> = {
  service_reminder: {
    subject: 'Service Reminder from Barry Service Auto',
    htmlTemplate: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Service Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${data.customerName || 'Valued Customer'},</p>
              <p>This is a friendly reminder that your vehicle is due for service.</p>
              ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${data.vehicleInfo}</p>` : ''}
              ${data.serviceType ? `<p><strong>Service Due:</strong> ${data.serviceType}</p>` : ''}
              ${data.message ? `<p>${data.message}</p>` : ''}
              <p>Please contact us to schedule your appointment.</p>
              <a href="${data.bookingUrl || '#'}" class="cta">Schedule Service</a>
            </div>
            <div class="footer">
              <p>Barry Service Auto</p>
              <p>123 Main Street, Anytown, ST 12345</p>
              <p>(555) 123-4567 | service@barryservice.com</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: (data) => `
Service Reminder from Barry Service Auto

Hello ${data.customerName || 'Valued Customer'},

This is a friendly reminder that your vehicle is due for service.

${data.vehicleInfo ? `Vehicle: ${data.vehicleInfo}` : ''}
${data.serviceType ? `Service Due: ${data.serviceType}` : ''}
${data.message || ''}

Please contact us to schedule your appointment.

Barry Service Auto
(555) 123-4567
service@barryservice.com
    `.trim(),
  },

  invoice: {
    subject: 'Invoice from Barry Service Auto',
    htmlTemplate: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .invoice-details { background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .total { font-size: 24px; font-weight: bold; color: #2563eb; }
            .cta { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice ${data.invoiceNumber || ''}</h1>
            </div>
            <div class="content">
              <p>Hello ${data.customerName || 'Valued Customer'},</p>
              <p>Thank you for choosing Barry Service Auto. Here are your invoice details:</p>
              <div class="invoice-details">
                ${data.invoiceNumber ? `<p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>` : ''}
                ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${data.vehicleInfo}</p>` : ''}
                ${data.serviceType ? `<p><strong>Service:</strong> ${data.serviceType}</p>` : ''}
                ${data.total ? `<p class="total">Total: $${data.total}</p>` : ''}
              </div>
              ${data.paymentUrl ? `<a href="${data.paymentUrl}" class="cta">Pay Now</a>` : ''}
              <p>${data.message || 'Thank you for your business!'}</p>
            </div>
            <div class="footer">
              <p>Barry Service Auto</p>
              <p>123 Main Street, Anytown, ST 12345</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: (data) => `
Invoice from Barry Service Auto

Hello ${data.customerName || 'Valued Customer'},

Thank you for choosing Barry Service Auto.

Invoice #: ${data.invoiceNumber || 'N/A'}
${data.vehicleInfo ? `Vehicle: ${data.vehicleInfo}` : ''}
${data.serviceType ? `Service: ${data.serviceType}` : ''}
${data.total ? `Total: $${data.total}` : ''}

${data.message || 'Thank you for your business!'}

Barry Service Auto
(555) 123-4567
    `.trim(),
  },

  appointment: {
    subject: 'Appointment Confirmation - Barry Service Auto',
    htmlTemplate: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .appointment-details { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Hello ${data.customerName || 'Valued Customer'},</p>
              <p>Your service appointment has been confirmed.</p>
              <div class="appointment-details">
                ${data.appointmentDate ? `<p><strong>Date:</strong> ${data.appointmentDate}</p>` : ''}
                ${data.appointmentTime ? `<p><strong>Time:</strong> ${data.appointmentTime}</p>` : ''}
                ${data.vehicleInfo ? `<p><strong>Vehicle:</strong> ${data.vehicleInfo}</p>` : ''}
                ${data.serviceType ? `<p><strong>Service:</strong> ${data.serviceType}</p>` : ''}
              </div>
              <p>${data.message || 'We look forward to seeing you!'}</p>
            </div>
            <div class="footer">
              <p>Barry Service Auto</p>
              <p>123 Main Street, Anytown, ST 12345</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: (data) => `
Appointment Confirmation - Barry Service Auto

Hello ${data.customerName || 'Valued Customer'},

Your service appointment has been confirmed.

${data.appointmentDate ? `Date: ${data.appointmentDate}` : ''}
${data.appointmentTime ? `Time: ${data.appointmentTime}` : ''}
${data.vehicleInfo ? `Vehicle: ${data.vehicleInfo}` : ''}
${data.serviceType ? `Service: ${data.serviceType}` : ''}

${data.message || 'We look forward to seeing you!'}

Barry Service Auto
123 Main Street, Anytown, ST 12345
(555) 123-4567
    `.trim(),
  },

  general: {
    subject: 'Message from Barry Service Auto',
    htmlTemplate: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.subject || 'Message'}</h1>
            </div>
            <div class="content">
              <p>Hello ${data.customerName || 'Valued Customer'},</p>
              <p>${data.message || ''}</p>
            </div>
            <div class="footer">
              <p>Barry Service Auto</p>
              <p>123 Main Street, Anytown, ST 12345</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: (data) => `
Message from Barry Service Auto

Hello ${data.customerName || 'Valued Customer'},

${data.message || ''}

Barry Service Auto
(555) 123-4567
    `.trim(),
  },
};

/**
 * Send a notification through the specified channel
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  const { channel, recipient, type, subject, message, metadata } = payload;

  try {
    switch (channel) {
      case 'email':
        return await sendEmailNotification(recipient, type, subject, message, metadata);

      case 'sms':
        return await sendSmsNotification(recipient, message);

      case 'in_app':
        return await sendInAppNotification(recipient, type, subject, message, metadata);

      case 'push':
        return await sendPushNotification(recipient, subject, message, metadata);

      default:
        return {
          success: false,
          channel,
          error: `Unknown notification channel: ${channel}`,
        };
    }
  } catch (error) {
    console.error(`Notification error (${channel}):`, error);
    return {
      success: false,
      channel,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  recipient: NotificationRecipient,
  type: NotificationType,
  subject: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<NotificationResult> {
  if (!recipient.email) {
    return {
      success: false,
      channel: 'email',
      error: 'No email address provided',
    };
  }

  // Check if SMTP is configured
  if (!config.smtp.host || !config.smtp.user) {
    console.log('SMTP not configured - logging email instead');
    console.log('Email to:', recipient.email);
    console.log('Subject:', subject);
    console.log('Message:', message);

    return {
      success: true,
      channel: 'email',
      messageId: `mock-${Date.now()}`,
    };
  }

  // Get template
  const template = EMAIL_TEMPLATES[type];
  const templateData = {
    customerName: recipient.name,
    subject,
    message,
    ...metadata,
  };

  const emailSubject = subject || template.subject;
  const htmlBody = template.htmlTemplate(templateData);
  const _textBody = template.textTemplate(templateData);

  // In production, you would use nodemailer or similar
  // For now, we'll use Supabase Edge Functions or log the email
  try {
    // If using Supabase Edge Functions for email:
    const { error } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: recipient.email,
        subject: emailSubject,
        html: htmlBody,
      },
    });

    if (error) {
      // Fall back to logging if edge function not available
      console.log('Email would be sent to:', recipient.email);
      console.log('Subject:', emailSubject);
    }

    return {
      success: true,
      channel: 'email',
      messageId: `email-${Date.now()}`,
    };
  } catch {
    // Edge function not available, log instead
    console.log('Email notification (logged):', {
      to: recipient.email,
      subject: emailSubject,
    });

    return {
      success: true,
      channel: 'email',
      messageId: `logged-${Date.now()}`,
    };
  }
}

/**
 * Send SMS notification
 */
async function sendSmsNotification(
  recipient: NotificationRecipient,
  message: string
): Promise<NotificationResult> {
  if (!recipient.phone) {
    return {
      success: false,
      channel: 'sms',
      error: 'No phone number provided',
    };
  }

  // In production, you would integrate with Twilio, AWS SNS, etc.
  // For now, log the SMS
  console.log('SMS notification (logged):', {
    to: recipient.phone,
    message: message.substring(0, 160), // SMS character limit
  });

  return {
    success: true,
    channel: 'sms',
    messageId: `sms-${Date.now()}`,
  };
}

/**
 * Send in-app notification (stores in database)
 */
async function sendInAppNotification(
  recipient: NotificationRecipient,
  type: NotificationType,
  subject: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<NotificationResult> {
  // Store notification in database for in-app display
  // This assumes a notifications table exists and recipient has a userId

  if (!recipient.userId) {
    // If no user ID, try to find by email
    if (recipient.email) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', recipient.email)
        .single();

      if (customer) {
        recipient.userId = customer.id;
      }
    }
  }

  const notificationData = {
    customer_id: recipient.userId,
    type,
    channel: 'in_app',
    subject,
    message,
    metadata,
    status: 'sent',
    sent_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    return {
      success: false,
      channel: 'in_app',
      error: error.message,
    };
  }

  return {
    success: true,
    channel: 'in_app',
    messageId: data.id,
  };
}

/**
 * Send push notification
 */
async function sendPushNotification(
  recipient: NotificationRecipient,
  title: string,
  body: string,
  _metadata?: Record<string, unknown>
): Promise<NotificationResult> {
  // In production, you would integrate with Firebase Cloud Messaging,
  // Apple Push Notification Service, etc.

  console.log('Push notification (logged):', {
    to: recipient.userId || recipient.email,
    title,
    body,
  });

  return {
    success: true,
    channel: 'push',
    messageId: `push-${Date.now()}`,
  };
}

/**
 * Send notification through multiple channels
 */
export async function sendMultiChannelNotification(
  payload: Omit<NotificationPayload, 'channel'>,
  channels: NotificationChannel[]
): Promise<NotificationResult[]> {
  const results = await Promise.all(
    channels.map(channel =>
      sendNotification({ ...payload, channel })
    )
  );

  return results;
}

/**
 * Create a notification record without sending
 */
export async function createNotificationRecord(
  customerId: string,
  type: NotificationType,
  channel: NotificationChannel,
  subject: string,
  message: string,
  metadata?: Record<string, unknown>,
  scheduledAt?: Date
): Promise<{ id: string } | null> {
  const notificationData = {
    customer_id: customerId,
    type,
    channel,
    subject,
    message,
    metadata,
    status: scheduledAt ? 'pending' : 'pending',
    scheduled_at: scheduledAt?.toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert(notificationData)
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create notification record:', error);
    return null;
  }

  return data;
}

/**
 * Get Supabase admin client for external use
 */
export function getSupabaseAdmin(): SupabaseClient {
  return supabaseAdmin;
}
