import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import {
  getServiceRecommendations,
  VehicleData,
  ServiceHistory,
  ServiceRecommendation,
} from './vehicle-intelligence.js';
import {
  sendNotification,
  createNotificationRecord,
  NotificationType,
} from './notification-service.js';

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

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the background scheduler
 */
export function startScheduler(): void {
  if (schedulerInterval) {
    console.log('Scheduler already running');
    return;
  }

  console.log(`Starting scheduler with interval: ${config.scheduler.intervalMs}ms`);

  // Run immediately on start
  runScheduledTasks().catch(console.error);

  // Then run on interval
  schedulerInterval = setInterval(() => {
    runScheduledTasks().catch(console.error);
  }, config.scheduler.intervalMs);
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Scheduler stopped');
  }
}

/**
 * Run all scheduled tasks
 */
async function runScheduledTasks(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running scheduled tasks...`);

  try {
    // Run tasks in parallel
    await Promise.all([
      checkDueServices(),
      sendPendingNotifications(),
      checkOverdueInvoices(),
    ]);

    console.log(`[${new Date().toISOString()}] Scheduled tasks completed`);
  } catch (error) {
    console.error('Scheduler error:', error);
  }
}

/**
 * Check for vehicles with due or overdue services
 */
async function checkDueServices(): Promise<void> {
  console.log('Checking for due services...');

  try {
    // Get all active vehicles with their customers and service history
    const { data: vehicles, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        mileage,
        engine_type,
        transmission,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          preferred_contact_method
        )
      `)
      .not('customer_id', 'is', null);

    if (vehicleError || !vehicles) {
      console.error('Error fetching vehicles:', vehicleError);
      return;
    }

    for (const vehicle of vehicles) {
      if (!vehicle.customer || !vehicle.mileage) continue;

      // Get service history for this vehicle
      const { data: serviceHistory, error: historyError } = await supabaseAdmin
        .from('service_records')
        .select('service_type, service_date, mileage_at_service')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'completed')
        .order('service_date', { ascending: false });

      if (historyError) {
        console.error(`Error fetching history for vehicle ${vehicle.id}:`, historyError);
        continue;
      }

      // Convert to expected format
      const vehicleData: VehicleData = {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        engineType: vehicle.engine_type,
        transmission: vehicle.transmission,
      };

      const history: ServiceHistory[] = (serviceHistory || []).map(s => ({
        serviceType: s.service_type,
        serviceDate: new Date(s.service_date),
        mileageAtService: s.mileage_at_service || 0,
      }));

      // Get recommendations
      const recommendations = getServiceRecommendations(vehicleData, history);

      // Filter to only overdue or soon-due services
      const urgentRecommendations = recommendations.filter(r =>
        r.overdue || r.priority === 'critical' || r.priority === 'high'
      );

      if (urgentRecommendations.length > 0) {
        await createServiceReminder(vehicle, urgentRecommendations);
      }
    }
  } catch (error) {
    console.error('Error in checkDueServices:', error);
  }
}

/**
 * Create service reminder notification
 */
async function createServiceReminder(
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    customer: {
      id: string;
      first_name: string;
      last_name: string;
      email?: string | null;
      phone?: string | null;
      preferred_contact_method?: string | null;
    };
  },
  recommendations: ServiceRecommendation[]
): Promise<void> {
  // Check if we've already sent a reminder recently (within 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: existingNotifications } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .eq('customer_id', vehicle.customer.id)
    .eq('type', 'service_reminder')
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(1);

  if (existingNotifications && existingNotifications.length > 0) {
    // Already sent a reminder recently
    return;
  }

  // Build notification message
  const overdueServices = recommendations.filter(r => r.overdue);
  const upcomingServices = recommendations.filter(r => !r.overdue);

  let message = '';
  if (overdueServices.length > 0) {
    message += `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} has overdue services:\n`;
    overdueServices.forEach(s => {
      message += `- ${s.serviceType}: ${s.reason}\n`;
    });
  }
  if (upcomingServices.length > 0) {
    if (message) message += '\n';
    message += `Upcoming services:\n`;
    upcomingServices.slice(0, 3).forEach(s => {
      message += `- ${s.serviceType}: ${s.reason}\n`;
    });
  }

  const subject = overdueServices.length > 0
    ? `Service Overdue - ${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : `Service Due Soon - ${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  // Determine notification channel
  const channel = vehicle.customer.preferred_contact_method === 'email' && vehicle.customer.email
    ? 'email'
    : vehicle.customer.preferred_contact_method === 'sms' && vehicle.customer.phone
      ? 'sms'
      : 'in_app';

  // Create notification record
  await createNotificationRecord(
    vehicle.customer.id,
    'service_reminder' as NotificationType,
    channel as 'email' | 'sms' | 'in_app' | 'push',
    subject,
    message,
    {
      vehicleId: vehicle.id,
      vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      recommendations: recommendations.map(r => ({
        service: r.serviceType,
        reason: r.reason,
        priority: r.priority,
        overdue: r.overdue,
      })),
    }
  );

  // Optionally send immediately for critical/overdue items
  if (overdueServices.some(s => s.priority === 'critical')) {
    await sendNotification({
      type: 'service_reminder',
      channel: channel as 'email' | 'sms' | 'in_app' | 'push',
      recipient: {
        email: vehicle.customer.email,
        phone: vehicle.customer.phone,
        name: `${vehicle.customer.first_name} ${vehicle.customer.last_name}`,
        userId: vehicle.customer.id,
      },
      subject,
      message,
      metadata: {
        vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        customerName: `${vehicle.customer.first_name} ${vehicle.customer.last_name}`,
      },
    });
  }
}

/**
 * Send pending scheduled notifications
 */
async function sendPendingNotifications(): Promise<void> {
  console.log('Checking for pending notifications...');

  try {
    const now = new Date().toISOString();

    // Get pending notifications that are scheduled for now or earlier
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .limit(50);

    if (error || !notifications) {
      console.error('Error fetching pending notifications:', error);
      return;
    }

    for (const notification of notifications) {
      if (!notification.customer) continue;

      try {
        await sendNotification({
          type: notification.type,
          channel: notification.channel,
          recipient: {
            email: notification.customer.email,
            phone: notification.customer.phone,
            name: `${notification.customer.first_name} ${notification.customer.last_name}`,
            userId: notification.customer.id,
          },
          subject: notification.subject,
          message: notification.message,
          metadata: notification.metadata,
        });

        // Update notification status
        await supabaseAdmin
          .from('notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', notification.id);
      } catch (sendError) {
        console.error(`Failed to send notification ${notification.id}:`, sendError);

        // Mark as failed
        await supabaseAdmin
          .from('notifications')
          .update({
            status: 'failed',
            error_message: sendError instanceof Error ? sendError.message : 'Unknown error',
          })
          .eq('id', notification.id);
      }
    }
  } catch (error) {
    console.error('Error in sendPendingNotifications:', error);
  }
}

/**
 * Check for overdue invoices and send reminders
 */
async function checkOverdueInvoices(): Promise<void> {
  console.log('Checking for overdue invoices...');

  try {
    const now = new Date().toISOString().split('T')[0];

    // Get invoices that are past due date and not paid
    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('status', 'sent')
      .lt('due_date', now);

    if (error || !invoices) {
      console.error('Error fetching overdue invoices:', error);
      return;
    }

    for (const invoice of invoices) {
      if (!invoice.customer) continue;

      // Update invoice status to overdue
      await supabaseAdmin
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('id', invoice.id);

      // Check if we've sent an overdue notice recently (within 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: existingNotifications } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('customer_id', invoice.customer.id)
        .eq('type', 'invoice')
        .gte('created_at', threeDaysAgo.toISOString())
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        continue; // Already notified recently
      }

      // Calculate days overdue
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Send overdue notice
      const subject = `Invoice #${invoice.invoice_number} - Payment Overdue`;
      const message = `Your invoice #${invoice.invoice_number} for $${invoice.total.toFixed(2)} was due on ${new Date(invoice.due_date).toLocaleDateString()} and is now ${daysOverdue} days overdue. Please submit payment at your earliest convenience.`;

      await sendNotification({
        type: 'invoice',
        channel: invoice.customer.email ? 'email' : 'in_app',
        recipient: {
          email: invoice.customer.email,
          phone: invoice.customer.phone,
          name: `${invoice.customer.first_name} ${invoice.customer.last_name}`,
          userId: invoice.customer.id,
        },
        subject,
        message,
        metadata: {
          invoiceNumber: invoice.invoice_number,
          total: invoice.total,
          dueDate: invoice.due_date,
          daysOverdue,
          customerName: `${invoice.customer.first_name} ${invoice.customer.last_name}`,
        },
      });
    }
  } catch (error) {
    console.error('Error in checkOverdueInvoices:', error);
  }
}

/**
 * Manually trigger scheduled tasks (for testing or admin use)
 */
export async function triggerScheduledTasks(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await runScheduledTasks();
    return {
      success: true,
      message: 'Scheduled tasks completed successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  intervalMs: number;
  nextRunEstimate?: Date;
} {
  return {
    running: schedulerInterval !== null,
    intervalMs: config.scheduler.intervalMs,
    nextRunEstimate: schedulerInterval
      ? new Date(Date.now() + config.scheduler.intervalMs)
      : undefined,
  };
}
