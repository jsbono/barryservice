import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for the database
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  mileage: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  cost_price: number;
  retail_price: number;
  stock_quantity: number;
  min_stock_level: number;
  category?: string;
  manufacturer?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  labor_hours: number;
  default_parts?: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  mechanic_id: string;
  service_template_id?: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  labor_hours: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  mechanic?: Mechanic;
}

export interface Invoice {
  id: string;
  service_record_id: string;
  customer_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  service_record?: ServiceRecord;
}

export interface Mechanic {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  specializations?: string[];
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  labor_rate: number;
  tax_rate: number;
  tax_name: string;
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  invoice_prefix: string;
  invoice_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}
