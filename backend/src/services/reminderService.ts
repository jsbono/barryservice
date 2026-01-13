import { query } from '../config/db.js';
import { config } from '../config/env.js';
import * as EmailLogModel from '../models/EmailLog.js';
import * as notificationService from './notificationService.js';

interface ServiceDue {
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

export interface ReminderJobResult {
  sent: number;
  skipped: number;
  errors: number;
  notifications: number;
}

/**
 * Run the reminder job - sends email and in-app notifications for services due soon.
 * This function is called by the cron scheduler and checks for services based on:
 * - Date-based: Services due within the configured daysBeforeDue window
 * - Mileage-based: Services due within the configured milesBeforeDue threshold
 *
 * Uses the notification service to handle both email and in-app notifications
 * with duplicate prevention based on suppressionDays configuration.
 */
export async function runReminderJob(): Promise<ReminderJobResult> {
  const { daysBeforeDue, milesBeforeDue, suppressionDays } = config.reminder;

  console.log('Running reminder job...');
  console.log(`Config: daysBeforeDue=${daysBeforeDue}, milesBeforeDue=${milesBeforeDue}, suppressionDays=${suppressionDays}`);

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysBeforeDue);

  const todayStr = today.toISOString().split('T')[0];
  const futureDateStr = futureDate.toISOString().split('T')[0];

  // Find all services that are due soon (by date or mileage)
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
      v.vin as vehicle_vin,
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
    AND c.email IS NOT NULL
    AND c.email != ''
  `, [futureDateStr, todayStr, milesBeforeDue]);

  console.log(`Found ${servicesDue.length} services due for reminders`);

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  let notifications = 0;

  for (const service of servicesDue) {
    // Check for recent email to prevent duplicates (legacy check)
    const recentEmail = EmailLogModel.findRecentByServiceLogId(service.service_log_id, suppressionDays);

    if (recentEmail) {
      console.log(`Skipping ${service.service_log_id} - email sent recently`);
      skipped++;
      continue;
    }

    // Calculate days until due if date-based
    let daysUntilDue: number | undefined;
    if (service.next_service_date) {
      const dueDate = new Date(service.next_service_date);
      daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    try {
      // Use the notification service to send both email and in-app notification
      const result = await notificationService.sendServiceReminder({
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
        nextServiceDate: service.next_service_date ? new Date(service.next_service_date) : undefined,
        nextServiceMileage: service.next_service_mileage || undefined,
        daysUntilDue,
        serviceLogId: service.service_log_id
      });

      if (result.email) {
        sent++;
        console.log(`Sent email reminder for service ${service.service_log_id} to ${service.customer_email}`);
      } else if (result.notification) {
        // Email not sent (SMTP not configured or duplicate), but notification created
        skipped++;
        console.log(`Created in-app notification only for service ${service.service_log_id} (email skipped)`);
      } else {
        // Both skipped (likely duplicate)
        skipped++;
        console.log(`Skipped duplicate reminder for service ${service.service_log_id}`);
      }

      if (result.notification) {
        notifications++;
      }
    } catch (error) {
      console.error(`Error sending reminder for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  console.log(`Reminder job complete: ${sent} emails sent, ${notifications} notifications created, ${skipped} skipped, ${errors} errors`);

  return { sent, skipped, errors, notifications };
}

/**
 * Check for overdue services and send alerts.
 * This is a separate function that can be called alongside the regular reminder job
 * to specifically target services that are past their due date.
 */
export async function runOverdueAlertJob(): Promise<ReminderJobResult> {
  const { suppressionDays } = config.reminder;

  console.log('Running overdue alert job...');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Find all services that are overdue
  const overdueServices = query<ServiceDue>(`
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

  console.log(`Found ${overdueServices.length} overdue services`);

  let sent = 0;
  let skipped = 0;
  let errors = 0;
  let notifications = 0;

  for (const service of overdueServices) {
    // Check for recent email to prevent spam
    const recentEmail = EmailLogModel.findRecentByServiceLogId(service.service_log_id, suppressionDays);

    if (recentEmail) {
      console.log(`Skipping overdue alert for ${service.service_log_id} - alert sent recently`);
      skipped++;
      continue;
    }

    // Calculate days overdue
    const dueDate = new Date(service.next_service_date!);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    try {
      const result = await notificationService.sendOverdueServiceAlert({
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

      if (result.email) {
        sent++;
        console.log(`Sent overdue alert for service ${service.service_log_id} to ${service.customer_email}`);
      } else if (result.notification) {
        skipped++;
        console.log(`Created in-app notification only for overdue service ${service.service_log_id}`);
      } else {
        skipped++;
        console.log(`Skipped duplicate overdue alert for service ${service.service_log_id}`);
      }

      if (result.notification) {
        notifications++;
      }
    } catch (error) {
      console.error(`Error sending overdue alert for service ${service.service_log_id}:`, error);
      errors++;
    }
  }

  console.log(`Overdue alert job complete: ${sent} emails sent, ${notifications} notifications created, ${skipped} skipped, ${errors} errors`);

  return { sent, skipped, errors, notifications };
}

/**
 * Run both reminder and overdue jobs together.
 * This is the recommended function to call from the daily scheduler.
 */
export async function runAllReminderJobs(): Promise<{
  reminders: ReminderJobResult;
  overdueAlerts: ReminderJobResult;
}> {
  console.log('='.repeat(50));
  console.log('Starting all reminder jobs at', new Date().toISOString());
  console.log('='.repeat(50));

  const reminders = await runReminderJob();
  const overdueAlerts = await runOverdueAlertJob();

  console.log('='.repeat(50));
  console.log('All reminder jobs complete');
  console.log('Reminders:', reminders);
  console.log('Overdue Alerts:', overdueAlerts);
  console.log('='.repeat(50));

  return { reminders, overdueAlerts };
}
