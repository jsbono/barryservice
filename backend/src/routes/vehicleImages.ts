import { Router, Request, Response } from 'express';
import { getVehicleImage, generateVehicleImage, getPlaceholderUrl } from '../services/vehicleImageService.js';
import * as VehicleModel from '../models/Vehicle.js';
import fs from 'fs';

const router = Router();

/**
 * GET /api/vehicle-images/proxy/:make/:model/:year
 * Serve vehicle image (generates if needed, serves from local storage)
 */
router.get('/proxy/:make/:model/:year', async (req: Request, res: Response): Promise<void> => {
  try {
    const { make, model, year } = req.params;
    const yearNum = parseInt(year, 10);

    if (!make || !model || isNaN(yearNum)) {
      res.status(400).send('Invalid parameters');
      return;
    }

    const imagePath = await getVehicleImage(make, model, yearNum);

    // If no local image, redirect to placeholder
    if (!imagePath || !fs.existsSync(imagePath)) {
      const placeholderUrl = getPlaceholderUrl(make, model);
      res.redirect(placeholderUrl);
      return;
    }

    // Serve the local file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Vehicle image error:', error);
    res.status(500).send('Failed to get vehicle image');
  }
});

/**
 * GET /api/vehicle-images/proxy/vehicle/:vehicleId
 * Serve vehicle image by vehicle ID
 */
router.get('/proxy/vehicle/:vehicleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const vehicle = VehicleModel.findById(vehicleId);

    if (!vehicle) {
      res.status(404).send('Vehicle not found');
      return;
    }

    const imagePath = await getVehicleImage(vehicle.make, vehicle.model, vehicle.year);

    // If no local image, redirect to placeholder
    if (!imagePath || !fs.existsSync(imagePath)) {
      const placeholderUrl = getPlaceholderUrl(vehicle.make, vehicle.model);
      res.redirect(placeholderUrl);
      return;
    }

    // Serve the local file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Vehicle image error:', error);
    res.status(500).send('Failed to get vehicle image');
  }
});

/**
 * GET /api/vehicle-images/:make/:model/:year
 * Get image info (JSON response with path info)
 */
router.get('/:make/:model/:year', async (req: Request, res: Response): Promise<void> => {
  try {
    const { make, model, year } = req.params;
    const yearNum = parseInt(year, 10);

    if (!make || !model || isNaN(yearNum)) {
      res.status(400).json({
        success: false,
        error: 'Invalid parameters. Required: make, model, year',
      });
      return;
    }

    const result = await generateVehicleImage(make, model, yearNum);

    res.json({
      success: true,
      hasLocalImage: !!result.imagePath,
      cached: result.cached,
      proxyUrl: `/api/vehicle-images/proxy/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${yearNum}`,
      vehicle: { make, model, year: yearNum },
    });
  } catch (error) {
    console.error('Vehicle image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle image',
    });
  }
});

/**
 * GET /api/vehicle-images/vehicle/:vehicleId
 * Get image info by vehicle ID
 */
router.get('/vehicle/:vehicleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const vehicle = VehicleModel.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    const result = await generateVehicleImage(vehicle.make, vehicle.model, vehicle.year);

    res.json({
      success: true,
      hasLocalImage: !!result.imagePath,
      cached: result.cached,
      proxyUrl: `/api/vehicle-images/proxy/vehicle/${vehicleId}`,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
      },
    });
  } catch (error) {
    console.error('Vehicle image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle image',
    });
  }
});

/**
 * POST /api/vehicle-images/generate
 * Force regenerate an image for a vehicle
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { make, model, year } = req.body;

    if (!make || !model || !year) {
      res.status(400).json({
        success: false,
        error: 'Required fields: make, model, year',
      });
      return;
    }

    const result = await generateVehicleImage(make, model, parseInt(year, 10));

    res.json({
      success: true,
      hasLocalImage: !!result.imagePath,
      cached: result.cached,
      proxyUrl: `/api/vehicle-images/proxy/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${year}`,
      vehicle: { make, model, year: parseInt(year, 10) },
    });
  } catch (error) {
    console.error('Vehicle image generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate vehicle image',
    });
  }
});

export default router;
