import { Request, Response } from 'express';
import * as VehicleModel from '../models/Vehicle.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as CustomerModel from '../models/Customer.js';
import { CreateVehicleRequest, UpdateVehicleRequest } from '../models/types.js';

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

export function create(req: Request, res: Response): void {
  try {
    const data = req.body as CreateVehicleRequest;

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

    const vehicle = VehicleModel.create(data);
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
