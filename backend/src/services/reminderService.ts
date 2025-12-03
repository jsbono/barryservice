import { query } from '../config/db.js';
import { config } from '../config/env.js';
import * as EmailLogModel from '../models/EmailLog.js';
import { sendEmail, buildReminderEmail } from './emailService.js';

interface ServiceDue {
  service_log_id: string;
  service_type: string;
  next_service_date: string | null;
  next_service_mileage: number | null;
  vehicle_id: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_mileage: number | null;
  customer_id: string;
  customer_name: string;
  customer_email: string;
}

export function runReminderJob(): { sent: number; skipped: number; errors: number } {
  const { daysBeforeDue, milesBeforeDue, suppressionDays } = config.reminder;

  console.log('Running reminder job...');

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysBeforeDue);

  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];

  // Find all services that are due soon
  const servicesDue = query<ServiceDue>(`
    SELECT
      sl.id as service_log_id,
      sl.service_type,
      sl.next_service_date,
      sl.next_service_mileage,
      v.id as vehicle_id,
      v.year as vehicle_year,
      v.make as vehicle_make,
      v.model as vehicle_model,
      v.mileage as vehicle_mileage,
      c.id as customer_id,
      c.name as customer_name,
      c.email as customer_email
    FROM service_logs sl
    JOIN vehicles v ON sl.vehicle_id = v.id
    JOIN customers c ON v.customer_id = c.id
    WHERE (
      (sl.next_service_date IS NOT NULL AND sl.next_service_date <= ? AND sl.next_service_date >= ?)
      OR
      (sl.next_service_mileage IS NOT NULL AND v.mileage IS NOT NULL AND sl.next_service_mileage - v.mileage <= ?)
    )
  `, [futureDateStr, todayStr, milesBeforeDue]);

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const service of servicesDue) {
    // Check for recent email
    const recentEmail = EmailLogModel.findRecentByServiceLogId(service.service_log_id, suppressionDays);

    if (recentEmail) {
      console.log(`Skipping ${service.service_log_id} - email sent recently`);
      skipped++;
      continue;
    }

    // Build and send email
    const emailContent = buildReminderEmail({
      customerName: service.customer_name,
      vehicle: {
        year: service.vehicle_year,
        make: service.vehicle_make,
        model: service.vehicle_model,
      },
      serviceType: service.service_type,
      nextServiceDate: service.next_service_date ? new Date(service.next_service_date) : undefined,
      nextServiceMileage: service.next_service_mileage || undefined,
    });

    try {
      const success = sendEmail({
        to: service.customer_email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      if (success) {
        EmailLogModel.create(service.service_log_id);
        sent++;
        console.log(`Sent reminder for service ${service.service_log_id} to ${service.customer_email}`);
      } else {
        // SMTP not configured but not an error
        skipped++;
      }
    } catch (error) {
      console.error(`Error sending email for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  console.log(`Reminder job complete: ${sent} sent, ${skipped} skipped, ${errors} errors`);

  return { sent, skipped, errors };
}
