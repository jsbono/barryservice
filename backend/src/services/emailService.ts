import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export function sendEmail(params: EmailParams): boolean {
  try {
    if (!config.smtp.user || !config.smtp.pass) {
      console.log('SMTP not configured, skipping email:', params.subject);
      return false;
    }

    // Note: In production, you'd want to handle this asynchronously
    transporter.sendMail({
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

export function buildReminderEmail(params: {
  customerName: string;
  vehicle: { year: number; make: string; model: string };
  serviceType: string;
  nextServiceDate?: Date;
  nextServiceMileage?: number;
}): { subject: string; text: string; html: string } {
  const { customerName, vehicle, serviceType, nextServiceDate, nextServiceMileage } = params;

  const datePart = nextServiceDate
    ? `around ${nextServiceDate.toLocaleDateString()}`
    : '';
  const mileagePart = nextServiceMileage
    ? `around ${nextServiceMileage.toLocaleString()} miles`
    : '';

  const when = [datePart, mileagePart].filter(Boolean).join(' or ');

  const subject = `Service reminder for your ${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const text = `
Hi ${customerName},

This is a reminder that your ${serviceType.replace(/_/g, ' ')} is coming due for your ${vehicle.year} ${vehicle.make} ${vehicle.model}${when ? ` (${when})` : ''}.

Reply to this email or call us to schedule your appointment.

Thank you,
Your mechanic
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
    .vehicle { font-weight: bold; color: #2563eb; }
    .cta { margin-top: 20px; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; display: inline-block; border-radius: 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Service Reminder</h2>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>This is a reminder that your <strong>${serviceType.replace(/_/g, ' ')}</strong> is coming due for your <span class="vehicle">${vehicle.year} ${vehicle.make} ${vehicle.model}</span>${when ? ` (${when})` : ''}.</p>
      <p>Reply to this email or call us to schedule your appointment.</p>
      <p>Thank you,<br>Your mechanic</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. If you've already scheduled this service, please disregard this message.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}
