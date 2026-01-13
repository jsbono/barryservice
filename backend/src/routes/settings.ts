import { Router, Request, Response } from 'express';
import * as ServicePriceModel from '../models/ServicePrice.js';
import { CreateServicePriceRequest, UpdateServicePriceRequest, UpdateLaborRateRequest } from '../models/types.js';

const router = Router();

// ============================================
// Service Prices
// ============================================

// GET /api/settings/service-prices - Get all service prices
router.get('/service-prices', (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const prices = ServicePriceModel.findAllServicePrices(includeInactive);
    res.json({ success: true, prices });
  } catch (error) {
    console.error('Error fetching service prices:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service prices' });
  }
});

// GET /api/settings/service-prices/:id - Get a specific service price
router.get('/service-prices/:id', (req: Request, res: Response) => {
  try {
    const price = ServicePriceModel.findServicePriceById(req.params.id);
    if (!price) {
      return res.status(404).json({ success: false, error: 'Service price not found' });
    }
    res.json({ success: true, price });
  } catch (error) {
    console.error('Error fetching service price:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service price' });
  }
});

// POST /api/settings/service-prices - Create a new service price
router.post('/service-prices', (req: Request, res: Response) => {
  try {
    const data: CreateServicePriceRequest = req.body;

    if (!data.service_type || !data.display_name || data.base_price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'service_type, display_name, and base_price are required',
      });
    }

    // Check for duplicate service_type
    const existing = ServicePriceModel.findServicePriceByType(data.service_type);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Service type already exists',
      });
    }

    const price = ServicePriceModel.createServicePrice({
      service_type: data.service_type,
      display_name: data.display_name,
      base_price: data.base_price,
      labor_hours: data.labor_hours || 1,
      description: data.description,
    });

    res.status(201).json({ success: true, price });
  } catch (error) {
    console.error('Error creating service price:', error);
    res.status(500).json({ success: false, error: 'Failed to create service price' });
  }
});

// PUT /api/settings/service-prices/:id - Update a service price
router.put('/service-prices/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateServicePriceRequest = req.body;
    const price = ServicePriceModel.updateServicePrice(req.params.id, data);

    if (!price) {
      return res.status(404).json({ success: false, error: 'Service price not found' });
    }

    res.json({ success: true, price });
  } catch (error) {
    console.error('Error updating service price:', error);
    res.status(500).json({ success: false, error: 'Failed to update service price' });
  }
});

// DELETE /api/settings/service-prices/:id - Delete a service price
router.delete('/service-prices/:id', (req: Request, res: Response) => {
  try {
    const deleted = ServicePriceModel.deleteServicePrice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Service price not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service price:', error);
    res.status(500).json({ success: false, error: 'Failed to delete service price' });
  }
});

// ============================================
// Labor Rates
// ============================================

// GET /api/settings/labor-rates - Get all labor rates
router.get('/labor-rates', (req: Request, res: Response) => {
  try {
    const rates = ServicePriceModel.findAllLaborRates();
    res.json({ success: true, rates });
  } catch (error) {
    console.error('Error fetching labor rates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch labor rates' });
  }
});

// GET /api/settings/labor-rates/default - Get default labor rate
router.get('/labor-rates/default', (req: Request, res: Response) => {
  try {
    const rate = ServicePriceModel.findDefaultLaborRate();
    if (!rate) {
      return res.status(404).json({ success: false, error: 'No default labor rate found' });
    }
    res.json({ success: true, rate });
  } catch (error) {
    console.error('Error fetching default labor rate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch default labor rate' });
  }
});

// PUT /api/settings/labor-rates/:id - Update a labor rate
router.put('/labor-rates/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateLaborRateRequest = req.body;
    const rate = ServicePriceModel.updateLaborRate(req.params.id, data);

    if (!rate) {
      return res.status(404).json({ success: false, error: 'Labor rate not found' });
    }

    res.json({ success: true, rate });
  } catch (error) {
    console.error('Error updating labor rate:', error);
    res.status(500).json({ success: false, error: 'Failed to update labor rate' });
  }
});

// POST /api/settings/labor-rates - Create a new labor rate
router.post('/labor-rates', (req: Request, res: Response) => {
  try {
    const { name, rate_per_hour, is_default } = req.body;

    if (!name || rate_per_hour === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name and rate_per_hour are required',
      });
    }

    const rate = ServicePriceModel.createLaborRate(name, rate_per_hour, is_default || false);
    res.status(201).json({ success: true, rate });
  } catch (error) {
    console.error('Error creating labor rate:', error);
    res.status(500).json({ success: false, error: 'Failed to create labor rate' });
  }
});

export default router;
