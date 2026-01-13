import { Router } from 'express';
import customersRouter from './customers.js';
import vehiclesRouter from './vehicles.js';
import servicesRouter from './services.js';
import partsRouter from './parts.js';
import invoicesRouter from './invoices.js';
import voiceRouter from './voice.js';
import notificationsRouter from './notifications.js';
import authRouter from './auth.js';

const router = Router();

// Auth routes (no authentication required for these)
router.use('/auth', authRouter);

// Protected resource routes
router.use('/customers', customersRouter);
router.use('/vehicles', vehiclesRouter);
router.use('/services', servicesRouter);
router.use('/parts', partsRouter);
router.use('/invoices', invoicesRouter);
router.use('/voice', voiceRouter);
router.use('/notifications', notificationsRouter);

// API info endpoint
router.get('/', (_req, res) => {
  res.json({
    name: 'Barry Service API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      customers: '/api/v1/customers',
      vehicles: '/api/v1/vehicles',
      services: '/api/v1/services',
      parts: '/api/v1/parts',
      invoices: '/api/v1/invoices',
      voice: '/api/v1/voice',
      notifications: '/api/v1/notifications',
    },
    documentation: '/api/v1/docs',
  });
});

export default router;
