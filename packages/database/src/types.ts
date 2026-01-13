/**
 * MotorAI Database Types
 * TypeScript type definitions matching the database schema
 */

// ============================================
// Enums
// ============================================

export type ServiceRecordStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export type UserType = 'customer' | 'mechanic' | 'admin';

export type NotificationType =
  | 'service_reminder'
  | 'invoice_ready'
  | 'payment_received'
  | 'service_complete'
  | 'appointment_reminder'
  | 'system';

// ============================================
// Base Types
// ============================================

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// ============================================
// Customer Types
// ============================================

export interface Customer extends Timestamps {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  login_email: string | null;
  passwordless_auth_token: string | null;
}

export interface CustomerInsert {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  login_email?: string | null;
  passwordless_auth_token?: string | null;
}

export interface CustomerUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  login_email?: string | null;
  passwordless_auth_token?: string | null;
}

// ============================================
// Vehicle Types
// ============================================

export interface Vehicle extends Timestamps {
  id: string;
  customer_id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  engine: string | null;
  mileage: number | null;
  last_service_date: string | null;
}

export interface VehicleInsert {
  id?: string;
  customer_id: string;
  vin?: string | null;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  mileage?: number | null;
  last_service_date?: string | null;
}

export interface VehicleUpdate {
  customer_id?: string;
  vin?: string | null;
  make?: string;
  model?: string;
  year?: number;
  engine?: string | null;
  mileage?: number | null;
  last_service_date?: string | null;
}

export interface VehicleWithCustomer extends Vehicle {
  customer: Customer;
}

// ============================================
// Mechanic Types
// ============================================

export interface Mechanic extends Timestamps {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hourly_rate: number;
  is_active: boolean;
}

export interface MechanicInsert {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  hourly_rate: number;
  is_active?: boolean;
}

export interface MechanicUpdate {
  name?: string;
  email?: string;
  phone?: string | null;
  hourly_rate?: number;
  is_active?: boolean;
}

// ============================================
// Service Record Types
// ============================================

export interface ParsedService {
  name: string;
  description?: string;
  category?: string;
  estimated_time?: number;
  parts_needed?: string[];
}

export interface ServiceRecord extends Timestamps {
  id: string;
  vehicle_id: string;
  mechanic_id: string | null;
  service_date: string;
  voice_transcript: string | null;
  parsed_services: ParsedService[];
  labor_hours: number | null;
  notes: string | null;
  status: ServiceRecordStatus;
}

export interface ServiceRecordInsert {
  id?: string;
  vehicle_id: string;
  mechanic_id?: string | null;
  service_date?: string;
  voice_transcript?: string | null;
  parsed_services?: ParsedService[];
  labor_hours?: number | null;
  notes?: string | null;
  status?: ServiceRecordStatus;
}

export interface ServiceRecordUpdate {
  vehicle_id?: string;
  mechanic_id?: string | null;
  service_date?: string;
  voice_transcript?: string | null;
  parsed_services?: ParsedService[];
  labor_hours?: number | null;
  notes?: string | null;
  status?: ServiceRecordStatus;
}

export interface ServiceRecordWithRelations extends ServiceRecord {
  vehicle: Vehicle;
  mechanic: Mechanic | null;
  parts: ServiceRecordPartWithPart[];
}

// ============================================
// Parts Types
// ============================================

export interface Part extends Timestamps {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  cost: number;
  retail_price: number;
  quantity_in_stock: number;
  reorder_threshold: number;
  is_active: boolean;
}

export interface PartInsert {
  id?: string;
  name: string;
  sku: string;
  description?: string | null;
  cost: number;
  retail_price: number;
  quantity_in_stock?: number;
  reorder_threshold?: number;
  is_active?: boolean;
}

export interface PartUpdate {
  name?: string;
  sku?: string;
  description?: string | null;
  cost?: number;
  retail_price?: number;
  quantity_in_stock?: number;
  reorder_threshold?: number;
  is_active?: boolean;
}

// ============================================
// Service Record Parts (Junction Table) Types
// ============================================

export interface ServiceRecordPart {
  id: string;
  service_record_id: string;
  part_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface ServiceRecordPartInsert {
  id?: string;
  service_record_id: string;
  part_id: string;
  quantity?: number;
  unit_price: number;
}

export interface ServiceRecordPartUpdate {
  quantity?: number;
  unit_price?: number;
}

export interface ServiceRecordPartWithPart extends ServiceRecordPart {
  part: Part;
}

// ============================================
// Invoice Types
// ============================================

export interface Invoice extends Timestamps {
  id: string;
  invoice_number: string | null;
  customer_id: string;
  vehicle_id: string;
  service_record_id: string | null;
  labor_total: number;
  parts_total: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  pdf_url: string | null;
  due_date: string | null;
  paid_at: string | null;
}

export interface InvoiceInsert {
  id?: string;
  invoice_number?: string | null;
  customer_id: string;
  vehicle_id: string;
  service_record_id?: string | null;
  labor_total?: number;
  parts_total?: number;
  tax?: number;
  discount?: number;
  total?: number;
  status?: InvoiceStatus;
  pdf_url?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
}

export interface InvoiceUpdate {
  customer_id?: string;
  vehicle_id?: string;
  service_record_id?: string | null;
  labor_total?: number;
  parts_total?: number;
  tax?: number;
  discount?: number;
  total?: number;
  status?: InvoiceStatus;
  pdf_url?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
}

export interface InvoiceWithRelations extends Invoice {
  customer: Customer;
  vehicle: Vehicle;
  service_record: ServiceRecord | null;
}

// ============================================
// Service Schedule Types
// ============================================

export interface ServiceSchedule extends Timestamps {
  id: string;
  vehicle_id: string;
  oil_change_interval: number;
  major_service_interval: number;
  minor_service_interval: number;
  last_oil_change: string | null;
  last_oil_change_mileage: number | null;
  last_major: string | null;
  last_major_mileage: number | null;
  last_minor: string | null;
  last_minor_mileage: number | null;
  next_oil_change_due: string | null;
  next_major_due: string | null;
  next_minor_due: string | null;
}

export interface ServiceScheduleInsert {
  id?: string;
  vehicle_id: string;
  oil_change_interval?: number;
  major_service_interval?: number;
  minor_service_interval?: number;
  last_oil_change?: string | null;
  last_oil_change_mileage?: number | null;
  last_major?: string | null;
  last_major_mileage?: number | null;
  last_minor?: string | null;
  last_minor_mileage?: number | null;
  next_oil_change_due?: string | null;
  next_major_due?: string | null;
  next_minor_due?: string | null;
}

export interface ServiceScheduleUpdate {
  oil_change_interval?: number;
  major_service_interval?: number;
  minor_service_interval?: number;
  last_oil_change?: string | null;
  last_oil_change_mileage?: number | null;
  last_major?: string | null;
  last_major_mileage?: number | null;
  last_minor?: string | null;
  last_minor_mileage?: number | null;
  next_oil_change_due?: string | null;
  next_major_due?: string | null;
  next_minor_due?: string | null;
}

export interface ServiceScheduleWithVehicle extends ServiceSchedule {
  vehicle: VehicleWithCustomer;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  user_type: UserType;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  user_id: string;
  user_type: UserType;
  type: NotificationType;
  title?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
  read?: boolean;
  read_at?: string | null;
}

export interface NotificationUpdate {
  title?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
  read?: boolean;
  read_at?: string | null;
}

// ============================================
// View Types
// ============================================

export interface VehicleServiceHistory {
  service_record_id: string;
  service_date: string;
  labor_hours: number | null;
  notes: string | null;
  status: ServiceRecordStatus;
  parsed_services: ParsedService[];
  vehicle_id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  mechanic_id: string | null;
  mechanic_name: string | null;
}

export interface UpcomingServiceDue {
  vehicle_id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  next_oil_change_due: string | null;
  next_major_due: string | null;
  next_minor_due: string | null;
  next_service_due: string | null;
}

export interface InvoiceSummary {
  invoice_id: string;
  invoice_number: string | null;
  labor_total: number;
  parts_total: number;
  tax: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  vehicle_id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
}

// ============================================
// Database Schema Type (for Supabase client)
// ============================================

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: Customer;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
      };
      vehicles: {
        Row: Vehicle;
        Insert: VehicleInsert;
        Update: VehicleUpdate;
      };
      mechanics: {
        Row: Mechanic;
        Insert: MechanicInsert;
        Update: MechanicUpdate;
      };
      service_records: {
        Row: ServiceRecord;
        Insert: ServiceRecordInsert;
        Update: ServiceRecordUpdate;
      };
      parts: {
        Row: Part;
        Insert: PartInsert;
        Update: PartUpdate;
      };
      service_record_parts: {
        Row: ServiceRecordPart;
        Insert: ServiceRecordPartInsert;
        Update: ServiceRecordPartUpdate;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      service_schedules: {
        Row: ServiceSchedule;
        Insert: ServiceScheduleInsert;
        Update: ServiceScheduleUpdate;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
    };
    Views: {
      vehicle_service_history: {
        Row: VehicleServiceHistory;
      };
      upcoming_service_due: {
        Row: UpcomingServiceDue;
      };
      invoice_summary: {
        Row: InvoiceSummary;
      };
    };
    Functions: Record<string, never>;
    Enums: {
      service_record_status: ServiceRecordStatus;
      invoice_status: InvoiceStatus;
      user_type: UserType;
      notification_type: NotificationType;
    };
  };
}
