import { Request, Response } from 'express';
import * as CustomerModel from '../models/Customer.js';
import * as VehicleModel from '../models/Vehicle.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as ServiceRecommendationModel from '../models/ServiceRecommendation.js';
import * as InvoiceModel from '../models/Invoice.js';
import { verifyPassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { query, queryOne, execute } from '../config/db.js';

// Customer login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find customer by email
    const customer = queryOne<{ id: string; name: string; email: string; password_hash: string }>(
      'SELECT id, name, email, password_hash FROM customers WHERE email = ?',
      [email]
    );

    if (!customer) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!customer.password_hash) {
      res.status(401).json({ error: 'Account not activated. Please contact the mechanic shop to set up your password.' });
      return;
    }

    const isValid = await verifyPassword(password, customer.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({
      userId: customer.id,
      email: customer.email,
      role: 'customer',
    });

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get current customer profile
export function getMe(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const customer = CustomerModel.findById(req.user.userId);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    res.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get customer's vehicles
export function getMyVehicles(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const vehicles = VehicleModel.findByCustomerId(req.user.userId);
    res.json({ vehicles });
  } catch (error) {
    console.error('Get customer vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get specific vehicle (only if owned by customer)
export function getVehicle(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const { vehicleId } = req.params;
    const vehicle = VehicleModel.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Verify ownership
    if (vehicle.customer_id !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get service history for a vehicle
export function getVehicleServices(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const { vehicleId } = req.params;
    const vehicle = VehicleModel.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Verify ownership
    if (vehicle.customer_id !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const services = ServiceLogModel.findByVehicleId(vehicleId);
    res.json({ services });
  } catch (error) {
    console.error('Get vehicle services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get recommended services for a vehicle
export function getVehicleRecommended(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const { vehicleId } = req.params;
    const vehicle = VehicleModel.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Verify ownership
    if (vehicle.customer_id !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get recommended services based on vehicle make/model/year
    const recommendations = ServiceRecommendationModel.getServices(
      vehicle.make,
      vehicle.model,
      vehicle.year
    );

    // Get service history to determine what's been done
    const serviceHistory = ServiceLogModel.findByVehicleId(vehicleId);

    // Calculate status for each recommendation
    const recommendedWithStatus = recommendations.map((rec) => {
      const lastService = serviceHistory.find(
        (s) => s.service_type.toLowerCase() === rec.service_name.toLowerCase()
      );

      let nextDueMileage: number | null = null;
      let status: 'due' | 'upcoming' | 'unknown' = 'unknown';

      if (rec.recommended_mileage && vehicle.mileage) {
        if (lastService?.mileage_at_service) {
          nextDueMileage = lastService.mileage_at_service + rec.recommended_mileage;
        } else {
          nextDueMileage = Math.ceil(vehicle.mileage / rec.recommended_mileage) * rec.recommended_mileage;
        }

        const milesUntilDue = nextDueMileage - vehicle.mileage;
        if (milesUntilDue <= 0) {
          status = 'due';
        } else if (milesUntilDue <= 1000) {
          status = 'due';
        } else {
          status = 'upcoming';
        }
      }

      return {
        ...rec,
        next_due_mileage: nextDueMileage,
        last_service_date: lastService?.service_date || null,
        last_service_mileage: lastService?.mileage_at_service || null,
        status,
      };
    });

    res.json({ recommended: recommendedWithStatus });
  } catch (error) {
    console.error('Get vehicle recommended error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get scheduled services for a vehicle
export function getVehicleScheduled(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const { vehicleId } = req.params;
    const vehicle = VehicleModel.findById(vehicleId);

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    // Verify ownership
    if (vehicle.customer_id !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get scheduled services
    const scheduled = query<{
      id: string;
      vehicle_id: string;
      service_type: string;
      scheduled_date: string;
      scheduled_time: string;
      notes: string;
      status: string;
    }>(
      `SELECT * FROM scheduled_services
       WHERE vehicle_id = ? AND status = 'pending' AND scheduled_date >= date('now')
       ORDER BY scheduled_date ASC`,
      [vehicleId]
    );

    res.json({ scheduled });
  } catch (error) {
    console.error('Get vehicle scheduled error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Set customer password (called by mechanic when creating account)
export async function setCustomerPassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const customer = CustomerModel.findById(id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const passwordHash = await hashPassword(password);
    execute(
      'UPDATE customers SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );

    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    console.error('Set customer password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get customer's invoices
export function getMyInvoices(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const { vehicle_id } = req.query;

    // Get all invoices for this customer
    let invoices = InvoiceModel.findByCustomerId(req.user.userId);

    // Optionally filter by vehicle
    if (vehicle_id && typeof vehicle_id === 'string') {
      invoices = invoices.filter(inv => inv.vehicle_id === vehicle_id);
    }

    // Filter out draft invoices - customers should only see sent/paid/overdue
    invoices = invoices.filter(inv => inv.status !== 'draft');

    // Attach vehicle info to each invoice
    const invoicesWithDetails = invoices.map(inv => {
      const vehicle = VehicleModel.findById(inv.vehicle_id);
      return {
        ...inv,
        vehicle: vehicle ? {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
        } : null,
      };
    });

    res.json({ invoices: invoicesWithDetails });
  } catch (error) {
    console.error('Get customer invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get invoice PDF for customer
export function getInvoicePdf(req: Request, res: Response): void {
  try {
    if (!req.user || req.user.role !== 'customer') {
      res.status(401).json({ error: 'Not authenticated as customer' });
      return;
    }

    const { invoiceId } = req.params;
    const invoice = InvoiceModel.findById(invoiceId);

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Verify ownership - invoice must belong to this customer
    if (invoice.customer_id !== req.user.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Don't allow access to draft invoices
    if (invoice.status === 'draft') {
      res.status(403).json({ error: 'Invoice not available' });
      return;
    }

    // Check if PDF exists
    if (!invoice.pdf_data) {
      res.status(404).json({ error: 'PDF not available' });
      return;
    }

    // Send PDF
    const pdfBuffer = Buffer.from(invoice.pdf_data, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Get invoice PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
