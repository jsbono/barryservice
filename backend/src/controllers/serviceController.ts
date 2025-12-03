import { Request, Response } from 'express';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as VehicleModel from '../models/Vehicle.js';
import { CreateServiceLogRequest, UpdateServiceLogRequest } from '../models/types.js';
import { computeNextService } from '../services/serviceIntervalService.js';
import { getExpectedServices, getServicesDueForReminder } from '../services/expectedServicesService.js';

export function list(req: Request, res: Response): void {
  try {
    const vehicleId = req.query.vehicle_id as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const services = ServiceLogModel.findAll(vehicleId, limit, offset);
    const total = ServiceLogModel.count(vehicleId);

    res.json({ services, total, limit, offset });
  } catch (error) {
    console.error('List services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const service = ServiceLogModel.findById(id);

    if (!service) {
      res.status(404).json({ error: 'Service log not found' });
      return;
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function create(req: Request, res: Response): void {
  try {
    const data = req.body as CreateServiceLogRequest;

    if (!data.vehicle_id || !data.service_type || !data.service_date) {
      res.status(400).json({ error: 'vehicle_id, service_type, and service_date are required' });
      return;
    }

    // Verify vehicle exists
    const vehicle = VehicleModel.findById(data.vehicle_id);
    if (!vehicle) {
      res.status(400).json({ error: 'Vehicle not found' });
      return;
    }

    // Compute next service date and mileage
    const serviceDate = new Date(data.service_date);
    const { nextServiceDate, nextServiceMileage } = computeNextService(
      data.service_type,
      serviceDate,
      data.mileage_at_service
    );

    const service = ServiceLogModel.create(data, nextServiceDate, nextServiceMileage);

    // Update vehicle mileage if provided
    if (data.mileage_at_service && (!vehicle.mileage || data.mileage_at_service > vehicle.mileage)) {
      VehicleModel.update(data.vehicle_id, { mileage: data.mileage_at_service });
    }

    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function update(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const data = req.body as UpdateServiceLogRequest;

    const existing = ServiceLogModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Service log not found' });
      return;
    }

    const service = ServiceLogModel.update(id, data);
    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getUpcoming(req: Request, res: Response): void {
  try {
    const services = ServiceLogModel.findUpcoming();
    res.json({ services });
  } catch (error) {
    console.error('Get upcoming services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getRecentActivity(req: Request, res: Response): void {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const services = ServiceLogModel.findRecentActivity(limit);
    res.json({ services });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getExpected(req: Request, res: Response): void {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    let services;
    if (status === 'due') {
      // Only overdue and due_soon
      services = getServicesDueForReminder();
    } else {
      // All expected services
      services = getExpectedServices();
    }

    // Apply limit
    const limitedServices = services.slice(0, limit);

    // Get summary counts
    const summary = {
      overdue: services.filter((s) => s.status === 'overdue').length,
      due_soon: services.filter((s) => s.status === 'due_soon').length,
      upcoming: services.filter((s) => s.status === 'upcoming').length,
      total: services.length,
    };

    res.json({ services: limitedServices, summary });
  } catch (error) {
    console.error('Get expected services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
