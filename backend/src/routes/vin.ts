/**
 * VIN Routes for MotorAI
 *
 * Endpoints for VIN decoding and vehicle service schedule management
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as VehicleIntelligence from '../services/vehicleIntelligence.js';
import * as ServiceScheduleModel from '../models/ServiceSchedule.js';
import * as VehicleModel from '../models/Vehicle.js';

const router = Router();

/**
 * GET /api/vin/decode/:vin
 * Decode a VIN and return vehicle information
 *
 * Public endpoint - no auth required for VIN lookup
 */
router.get('/decode/:vin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { vin } = req.params;

    if (!vin) {
      res.status(400).json({ error: 'VIN parameter is required' });
      return;
    }

    const result = await VehicleIntelligence.decodeVIN(vin);

    if (!result.success) {
      res.status(400).json({
        error: result.errorMessage || 'Failed to decode VIN',
        vin: result.vin,
      });
      return;
    }

    // Determine vehicle category and get recommended intervals
    const category = VehicleIntelligence.determineVehicleCategory(
      result.bodyClass,
      result.vehicleType,
      result.fuelType
    );
    const intervals = VehicleIntelligence.getServiceIntervals(category, result.year);

    res.json({
      success: true,
      data: {
        vin: result.vin,
        make: result.make,
        model: result.model,
        year: result.year,
        engineModel: result.engineModel,
        fuelType: result.fuelType,
        driveType: result.driveType,
        vehicleType: result.vehicleType,
        bodyClass: result.bodyClass,
        category,
        recommendedIntervals: {
          oilChange: {
            miles: intervals.oilChangeMiles || null,
            months: intervals.oilChangeMonths || null,
          },
          minorService: {
            miles: intervals.minorServiceMiles,
            months: intervals.minorServiceMonths,
          },
          majorService: {
            miles: intervals.majorServiceMiles,
            months: intervals.majorServiceMonths,
          },
        },
      },
    });
  } catch (error) {
    console.error('VIN decode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected routes - require authentication
router.use(authMiddleware);

/**
 * POST /api/vin/vehicles/:id/schedule
 * Create or update a service schedule for a vehicle
 *
 * Body:
 * - lastServiceDate?: string (ISO date)
 * - currentMileage?: number
 * - forceRecreate?: boolean (if true, recreate schedule even if one exists)
 */
router.post('/vehicles/:id/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { lastServiceDate, currentMileage, forceRecreate } = req.body;

    // Verify vehicle exists
    const vehicle = VehicleModel.findById(id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Check if schedule already exists
    const existingSchedule = ServiceScheduleModel.findByVehicleId(id);
    if (existingSchedule && !forceRecreate) {
      res.status(200).json({
        message: 'Service schedule already exists',
        schedule: existingSchedule,
      });
      return;
    }

    // Decode VIN if available to get vehicle info
    let vinInfo: VehicleIntelligence.VINDecodeResult;
    if (vehicle.vin) {
      vinInfo = await VehicleIntelligence.decodeVIN(vehicle.vin);
    } else {
      // Create a minimal VIN info object from vehicle data
      vinInfo = {
        vin: '',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        engineModel: null,
        fuelType: null,
        driveType: null,
        vehicleType: null,
        bodyClass: null,
        rawResults: [],
        success: true,
      };
    }

    // Parse dates
    const serviceDate = lastServiceDate ? new Date(lastServiceDate) : undefined;
    const mileage = currentMileage ?? vehicle.mileage;

    // Create or update the schedule
    const schedule = VehicleIntelligence.createServiceScheduleForVehicle(
      id,
      vinInfo,
      serviceDate,
      mileage
    );

    res.status(existingSchedule ? 200 : 201).json({
      message: existingSchedule ? 'Service schedule updated' : 'Service schedule created',
      schedule,
    });
  } catch (error) {
    console.error('Create service schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/vin/vehicles/:id/schedule
 * Get the service schedule for a vehicle
 */
router.get('/vehicles/:id/schedule', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const currentMileage = req.query.mileage ? parseInt(req.query.mileage as string) : undefined;

    // Verify vehicle exists
    const vehicle = VehicleModel.findById(id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Get schedule
    const schedule = ServiceScheduleModel.findByVehicleId(id);
    if (!schedule) {
      res.status(404).json({
        error: 'Service schedule not found for this vehicle',
        hint: 'POST to /api/vin/vehicles/:id/schedule to create one',
      });
      return;
    }

    // Get upcoming services with urgency info
    const mileage = currentMileage ?? vehicle.mileage;
    const upcomingServices = VehicleIntelligence.getUpcomingServices(id, mileage);

    // Parse interval config if available
    let intervalConfig = null;
    if (schedule.interval_config) {
      try {
        intervalConfig = JSON.parse(schedule.interval_config);
      } catch {
        // Ignore parse errors
      }
    }

    res.json({
      schedule,
      upcomingServices,
      intervalConfig,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        mileage: vehicle.mileage,
      },
    });
  } catch (error) {
    console.error('Get service schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/vin/vehicles/:id/schedule
 * Update service schedule after a service is performed
 *
 * Body:
 * - serviceType: 'oil_change' | 'minor' | 'major'
 * - serviceDate: string (ISO date)
 * - mileageAtService?: number
 */
router.put('/vehicles/:id/schedule', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { serviceType, serviceDate, mileageAtService } = req.body;

    // Validate inputs
    if (!serviceType || !['oil_change', 'minor', 'major'].includes(serviceType)) {
      res.status(400).json({
        error: 'Invalid serviceType. Must be "oil_change", "minor", or "major"',
      });
      return;
    }

    if (!serviceDate) {
      res.status(400).json({ error: 'serviceDate is required' });
      return;
    }

    // Verify vehicle exists
    const vehicle = VehicleModel.findById(id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Update the schedule
    const schedule = VehicleIntelligence.updateScheduleAfterService(
      id,
      serviceType,
      new Date(serviceDate),
      mileageAtService
    );

    if (!schedule) {
      res.status(404).json({
        error: 'Service schedule not found for this vehicle',
        hint: 'POST to /api/vin/vehicles/:id/schedule to create one first',
      });
      return;
    }

    res.json({
      message: 'Service schedule updated',
      schedule,
    });
  } catch (error) {
    console.error('Update service schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/vin/vehicles/:id/schedule
 * Delete the service schedule for a vehicle
 */
router.delete('/vehicles/:id/schedule', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    // Verify vehicle exists
    const vehicle = VehicleModel.findById(id);
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const deleted = ServiceScheduleModel.removeByVehicleId(id);

    if (!deleted) {
      res.status(404).json({ error: 'No service schedule found for this vehicle' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete service schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/vin/schedules/upcoming
 * Get all upcoming service schedules across all vehicles
 */
router.get('/schedules/upcoming', (req: Request, res: Response): void => {
  try {
    const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;
    const schedules = ServiceScheduleModel.findUpcomingWithVehicles(daysAhead);

    res.json({
      schedules,
      total: schedules.length,
      daysAhead,
    });
  } catch (error) {
    console.error('Get upcoming schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/vin/schedules/overdue
 * Get all overdue service schedules
 */
router.get('/schedules/overdue', (req: Request, res: Response): void => {
  try {
    const schedules = ServiceScheduleModel.findOverdue();

    res.json({
      schedules,
      total: schedules.length,
    });
  } catch (error) {
    console.error('Get overdue schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
