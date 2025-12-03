import { Request, Response } from 'express';
import * as CustomerModel from '../models/Customer.js';
import * as VehicleModel from '../models/Vehicle.js';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../models/types.js';
import { hashPassword } from '../utils/password.js';
import { execute, queryOne } from '../config/db.js';

export function list(req: Request, res: Response): void {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const customers = CustomerModel.findAll(limit, offset);
    const total = CustomerModel.count();

    res.json({ customers, total, limit, offset });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function getById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const customer = CustomerModel.findById(id);

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const vehicles = VehicleModel.findByCustomerId(id);

    res.json({ ...customer, vehicles });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function create(req: Request, res: Response): void {
  try {
    const data = req.body as CreateCustomerRequest;

    if (!data.name || !data.email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const customer = CustomerModel.create(data);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function update(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const data = req.body as UpdateCustomerRequest;

    const existing = CustomerModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const customer = CustomerModel.update(id, data);
    res.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function remove(req: Request, res: Response): void {
  try {
    const { id } = req.params;

    const existing = CustomerModel.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    CustomerModel.remove(id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
