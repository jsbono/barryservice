import { Request, Response } from 'express';
import * as VehicleModel from '../models/Vehicle.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as CustomerModel from '../models/Customer.js';
import { CreateVehicleRequest, UpdateVehicleRequest } from '../models/types.js';
import * as VehicleIntelligence from '../services/vehicleIntelligence.js';

export function list(req: Request, res: Response): void {
  try {
    const customerId = req.query.customer_id as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const vehicles = VehicleModel.findAll(customerId, limit, offset);
    const total = VehicleModel.count(customerId);

    res.json({ vehicles, total, limit, offset });
  } catch (error) {
    console.error('List vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const vehicle = VehicleModel.findByIdWithCustomer(id);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const serviceLogs = ServiceLogModel.findByVehicleId(id);

    res.json({ ...vehicle, service_logs: serviceLogs });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    let data = req.body as CreateVehicleRequest;

    if (!data.customer_id || !data.make || !data.model || !data.year) {
      res.status(400).json({ error: 'customer_id, make, model, and year are required' });
      return;
    }

    // Verify customer exists
    const customer = CustomerModel.findById(data.customer_id);
    if (!customer) {
      res.status(400).json({ error: 'Customer not found' });
      return;
    }

    // Auto-decode VIN if provided to enhance vehicle data
    let vinDecodeResult: VehicleIntelligence.VINDecodeResult | null = null;
    if (data.vin) {
      try {
        vinDecodeResult = await VehicleIntelligence.decodeVIN(data.vin);
        if (vinDecodeResult.success) {
          // Use decoded data if our data is missing or generic
          // Only override if the decoded values are present
          if (vinDecodeResult.make && (!data.make || data.make === 'Unknown')) {
            data = { ...data, make: vinDecodeResult.make };
          }
          if (vinDecodeResult.model && (!data.model || data.model === 'Unknown')) {
            data = { ...data, model: vinDecodeResult.model };
          }
          if (vinDecodeResult.year && !data.year) {
            data = { ...data, year: vinDecodeResult.year };
          }
        }
      } catch (vinError) {
        // Log but don't fail - VIN decode is optional enhancement
        console.warn('VIN decode failed during vehicle creation:', vinError);
      }
    }

    const vehicle = VehicleModel.create(data);

    // Auto-create service schedule for the new vehicle
    try {
      const scheduleVinInfo = vinDecodeResult || {
        vin: data.vin || '',
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

      VehicleIntelligence.createServiceScheduleForVehicle(
        vehicle.id,
        scheduleVinInfo,
        undefined, // lastServiceDate
        vehicle.mileage || undefined
      );
    } catch (scheduleError) {
      // Log but don't fail - schedule creation is optional
      console.warn('Service schedule creation failed:', scheduleError);
    }

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function update(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const data = req.body as UpdateVehicleRequest;

    const existing = VehicleModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const vehicle = VehicleModel.update(id, data);
    res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function remove(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const existing = VehicleModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    VehicleModel.remove(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
