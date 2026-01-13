export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
  created_at: string;
  customer?: Customer;
  service_logs?: ServiceLog[];
}

export interface ServiceLog {
  id: string;
  vehicle_id: string;
  service_type: string;
  notes?: string;
  service_date: string;
  mileage_at_service?: number;
  labor_hours?: number;
  next_service_date?: string;
  next_service_mileage?: number;
  created_at: string;
  vehicle?: Vehicle;
}

export interface ServiceRecommendation {
  id: string;
  make: string;
  model: string;
  year: number;
  service_name: string;
  recommended_mileage?: number;
  recommended_time_months?: number;
  category?: 'minor' | 'major';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse {
  total: number;
  limit: number;
  offset: number;
}

export interface CustomersResponse extends PaginatedResponse {
  customers: Customer[];
}

export interface VehiclesResponse extends PaginatedResponse {
  vehicles: Vehicle[];
}

export interface ServicesResponse extends PaginatedResponse {
  services: ServiceLog[];
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateVehicleRequest {
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
}

export interface CreateServiceLogRequest {
  vehicle_id: string;
  service_type: string;
  notes?: string;
  service_date: string;
  mileage_at_service?: number;
  labor_hours?: number;
}

// Customer Portal Types
export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CustomerLoginResponse {
  token: string;
  customer: CustomerUser;
}

export interface PortalVehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
  created_at: string;
}

export interface PortalServiceLog {
  id: string;
  vehicle_id: string;
  service_type: string;
  notes?: string;
  service_date: string;
  mileage_at_service?: number;
  labor_hours?: number;
  next_service_date?: string;
  next_service_mileage?: number;
  created_at: string;
}

export interface PortalRecommendedService {
  id: string;
  service_name: string;
  recommended_mileage?: number;
  recommended_time_months?: number;
  category?: 'minor' | 'major';
  next_due_mileage: number | null;
  last_service_date: string | null;
  last_service_mileage: number | null;
  status: 'due' | 'upcoming' | 'unknown';
}

export interface PortalScheduledService {
  id: string;
  vehicle_id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time?: string;
  notes?: string;
  status: string;
}

// AI Insights Types
export type InsightType = 'service_due' | 'customer_health' | 'revenue_opportunity' | 'anomaly' | 'digest';
export type InsightPriority = 'high' | 'medium' | 'low';
export type InsightActionType = 'schedule_service' | 'contact_customer' | 'review' | 'dismiss' | null;

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  body: string;
  customer_id?: string;
  vehicle_id?: string;
  action_type?: InsightActionType;
  action_url?: string;
  metadata?: Record<string, unknown>;
  read_at?: string;
  actioned_at?: string;
  dismissed_at?: string;
  created_at: string;
  expires_at?: string;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface InsightsResponse {
  insights: Insight[];
  meta: {
    unreadCount: number;
    priorityCounts: { high: number; medium: number; low: number };
    total: number;
  };
}

export interface InsightStats {
  unreadCount: number;
  priorityCounts: { high: number; medium: number; low: number };
  agentStats: {
    totalRuns: number;
    successfulRuns: number;
    totalInsightsCreated: number;
    totalTokensUsed: number;
  };
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  line_type: 'labor' | 'part';
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  vehicle_id: string;
  service_log_id?: string;
  labor_total: number;
  parts_total: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  due_date?: string;
  paid_date?: string;
  pdf_data?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  vehicle?: Vehicle;
  line_items?: InvoiceLineItem[];
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

export interface InvoiceStats {
  total_invoices: number;
  draft_count: number;
  sent_count: number;
  paid_count: number;
  overdue_count: number;
  total_revenue: number;
  outstanding_amount: number;
}

export interface CreateInvoiceRequest {
  service_log_id: string;
  labor_hours: number;
  hourly_rate?: number;
  parts?: Array<{ part_id: string; quantity: number }>;
  tax_rate?: number;
  notes?: string;
  payment_terms?: number;
}

// Voice Processing Types
export interface ParsedService {
  code: string;
  name: string;
  confidence: number;
}

export interface ParsedPart {
  name: string;
  quantity: number;
  confidence: number;
}

export interface VoiceParsedData {
  services: ParsedService[];
  laborHours: number | null;
  parts: ParsedPart[];
  notes: string;
  confidence: number;
}

export interface VoiceParseResponse {
  success: boolean;
  data: VoiceParsedData;
  vehicle?: Vehicle;
}

export interface VoiceTranscribeResponse {
  success: boolean;
  transcript: string;
}

export interface VoiceProcessResponse {
  success: boolean;
  data: VoiceParsedData & { transcript: string };
  vehicle?: Vehicle;
}

export interface ServiceCode {
  code: string;
  name: string;
  keywords: string[];
}

// Part Types
export interface Part {
  id: string;
  sku: string;
  name: string;
  description?: string;
  cost: number;
  retail_price: number;
  quantity_in_stock: number;
  reorder_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartsResponse {
  parts: Part[];
  total: number;
}

// Service Pricing Types
export interface ServicePrice {
  id: string;
  service_type: string;
  display_name: string;
  base_price: number;
  labor_hours: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Labor Rate Types
export interface LaborRate {
  id: string;
  name: string;
  rate_per_hour: number;
  is_default: boolean;
  created_at: string;
}
