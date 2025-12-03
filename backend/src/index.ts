import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { runReminderJob } from './services/reminderService.js';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import vehicleRoutes from './routes/vehicles.js';
import serviceRoutes from './routes/services.js';
import lookupRoutes from './routes/lookup.js';
import automationRoutes from './routes/automation.js';
import customerPortalRoutes from './routes/customerPortal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
cron.schedule('0 9 * * *', async () => {
  console.log('Running scheduled reminder job...');
  try {
    await runReminderJob();
  } catch (error) {
    console.error('Scheduled reminder job failed:', error);
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
