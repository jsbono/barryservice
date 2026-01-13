import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { runAllReminderJobs } from './services/reminderService.js';
import { cleanupOldNotifications } from './services/notificationService.js';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import vehicleRoutes from './routes/vehicles.js';
import serviceRoutes from './routes/services.js';
import lookupRoutes from './routes/lookup.js';
import automationRoutes from './routes/automation.js';
import customerPortalRoutes from './routes/customerPortal.js';
import insightsRoutes from './routes/insights.js';
import agentsRoutes from './routes/agents.js';
import voiceRoutes from './routes/voice.js';
import vinRoutes from './routes/vin.js';
import invoiceRoutes from './routes/invoices.js';
import notificationsRoutes from './routes/notifications.js';
import partsRoutes from './routes/parts.js';
import vehicleImagesRoutes from './routes/vehicleImages.js';
import settingsRoutes from './routes/settings.js';
import { startAgentScheduler } from './agent/scheduler.js';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/lookup', lookupRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/portal', customerPortalRoutes); // Customer portal API
app.use('/api/insights', insightsRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/vin', vinRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/vehicle-images', vehicleImagesRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
if (config.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Schedule reminder job to run daily at 9 AM
// This sends service reminders and overdue alerts via email and in-app notifications
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled reminder jobs...');
  try {
    await runAllReminderJobs();
  } catch (error) {
    console.error('Scheduled reminder jobs failed:', error);
  }
});

// Schedule weekly notification cleanup on Sundays at 2 AM
// Removes notifications older than 90 days
cron.schedule('0 2 * * 0', () => {
  console.log('Running notification cleanup...');
  try {
    const deleted = cleanupOldNotifications(90);
    console.log(`Notification cleanup complete: ${deleted} old notifications removed`);
  } catch (error) {
    console.error('Notification cleanup failed:', error);
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);

  // Start the AI agent scheduler
  startAgentScheduler();
});

export default app;
