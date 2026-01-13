export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  mileage?: number;
  created_at: Date;
}

export interface ServiceLog {
  id: string;
  vehicle_id: string;
  service_type: string;
  notes?: string;
  service_date: Date;
  mileage_at_service?: number;
  labor_hours?: number;
  next_service_date?: Date;
  next_service_mileage?: number;
  created_at: Date;
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

export interface EmailLog {
  id: string;
  service_log_id: string;
  email_sent_at: Date;
}

export interface ServiceInterval {
  id: string;
  service_type: string;
  mileage_increment?: number;
  time_months?: number;
}

// Vehicle Intelligence Engine types
export type VehicleCategory = 'truck' | 'suv' | 'sedan' | 'hybrid' | 'electric' | 'van' | 'sports' | 'luxury' | 'unknown';

export interface ServiceSchedule {
  id: string;
  vehicle_id: string;
  vehicle_category: VehicleCategory;
  last_service_date?: string;
  last_service_mileage?: number;
  oil_change_interval_miles?: number;
  oil_change_interval_months?: number;
  minor_service_interval_miles?: number;
  minor_service_interval_months?: number;
  major_service_interval_miles?: number;
  major_service_interval_months?: number;
  next_oil_change_date?: string;
  next_oil_change_mileage?: number;
  next_minor_service_date?: string;
  next_minor_service_mileage?: number;
  next_major_service_date?: string;
  next_major_service_mileage?: number;
  interval_config?: string;
  created_at: string;
  updated_at: string;
}

export interface VINDecodeResult {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  engineModel: string | null;
  fuelType: string | null;
  driveType: string | null;
  vehicleType: string | null;
  bodyClass: string | null;
  success: boolean;
  errorMessage?: string;
}

export interface ServiceIntervalConfig {
  oilChangeMiles: number;
  oilChangeMonths: number;
  minorServiceMiles: number;
  minorServiceMonths: number;
  majorServiceMiles: number;
  majorServiceMonths: number;
}

export interface UpcomingService {
  type: 'oil_change' | 'minor_service' | 'major_service';
  dueDate: string | null;
  dueMileage: number | null;
  urgency: 'overdue' | 'urgent' | 'upcoming' | 'scheduled';
  daysUntilDue: number | null;
  milesUntilDue: number | null;
}

// Extended types for API responses
export interface VehicleWithCustomer extends Vehicle {
  customer?: Customer;
}

export interface ServiceLogWithVehicle extends ServiceLog {
  vehicle?: VehicleWithCustomer;
}

export interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[];
}

// Request types
export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
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

export interface UpdateVehicleRequest {
  make?: string;
  model?: string;
  year?: number;
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

export interface UpdateServiceLogRequest {
  service_type?: string;
  notes?: string;
  service_date?: string;
  mileage_at_service?: number;
  labor_hours?: number;
  next_service_date?: string;
  next_service_mileage?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

// AI Insights Engine types
export type InsightType = 'service_due' | 'customer_health' | 'revenue' | 'anomaly' | 'digest';
export type InsightPriority = 'high' | 'medium' | 'low';
export type InsightActionType = 'schedule_service' | 'contact_customer' | 'review' | 'create_estimate' | 'view';

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
  metadata?: string;
  read_at?: string;
  actioned_at?: string;
  dismissed_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface InsightWithRelations extends Insight {
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface CreateInsightRequest {
  type: InsightType;
  priority: InsightPriority;
  title: string;
  body: string;
  customer_id?: string;
  vehicle_id?: string;
  action_type?: InsightActionType;
  action_url?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export type AgentRunStatus = 'running' | 'completed' | 'failed';

export interface AgentRun {
  id: string;
  agent_type: string;
  started_at: string;
  completed_at?: string;
  status: AgentRunStatus;
  insights_created: number;
  tokens_used?: number;
  cost_cents?: number;
  error_message?: string;
  metadata?: string;
}

export interface CreateAgentRunRequest {
  agent_type: string;
}

export interface UpdateAgentRunRequest {
  status?: AgentRunStatus;
  completed_at?: string;
  insights_created?: number;
  tokens_used?: number;
  cost_cents?: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

// Part types (matches existing database schema)
export interface Part {
  id: string;
  name: string;
  sku: string;
  description?: string;
  cost: number;
  retail_price: number;
  quantity_in_stock: number;
  reorder_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePartRequest {
  sku: string;
  name: string;
  description?: string;
  cost: number;
  retail_price: number;
  quantity_in_stock?: number;
  reorder_threshold?: number;
}

export interface UpdatePartRequest {
  sku?: string;
  name?: string;
  description?: string;
  cost?: number;
  retail_price?: number;
  quantity_in_stock?: number;
  reorder_threshold?: number;
  is_active?: boolean;
}

// Invoice types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  vehicle_id: string;
  service_log_id?: string;
  invoice_date?: string;
  due_date?: string;
  status: InvoiceStatus;
  // New fields for detailed invoicing
  subtotal?: number;
  tax_rate?: number;
  // Existing schema fields
  labor_total: number;
  parts_total: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  payment_terms?: number;
  pdf_data?: string;
  pdf_url?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  line_type: 'labor' | 'part';
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  part_id?: string;
  labor_hours?: number;
}

export interface InvoiceWithDetails extends Invoice {
  line_items: InvoiceLineItem[];
  customer?: Customer;
  vehicle?: Vehicle;
  service_log?: ServiceLog;
}

export interface CreateInvoiceLineItemRequest {
  line_type: 'labor' | 'part';
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  part_id?: string;
  labor_hours?: number;
}

export interface CreateInvoiceRequest {
  customer_id: string;
  vehicle_id?: string;
  service_log_id?: string;
  invoice_date?: string;
  due_date?: string;
  status?: InvoiceStatus;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  notes?: string;
  payment_terms?: number;
  pdf_data?: string;
  line_items?: CreateInvoiceLineItemRequest[];
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  notes?: string;
  due_date?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  pdf_data?: string;
  sent_at?: string;
}

// Invoice generation from service record
export interface ServiceRecordForInvoice {
  service_log_id: string;
  labor_hours: number;
  hourly_rate: number;
  parts: Array<{
    part_id: string;
    quantity: number;
  }>;
  tax_rate?: number;
  notes?: string;
  payment_terms?: number;
}

// Voice Processing types
export interface VoiceParsedService {
  name: string;
  code: string;
}

export interface VoiceParsedPart {
  name: string;
  quantity: number;
  matchedSku: string | null;
}

export interface VoiceParsedData {
  services: VoiceParsedService[];
  laborHours: number | null;
  parts: VoiceParsedPart[];
  notes: string | null;
  raw: {
    extractedText: string;
    confidence: number;
  };
}

export interface VoiceParseRequest {
  transcript: string;
  vehicleId?: string;
}

export interface VoiceParseResponse {
  success: boolean;
  data?: VoiceParsedData;
  vehicle?: Vehicle;
  error?: string;
}

export interface VoiceTranscribeResponse {
  success: boolean;
  transcript?: string;
  error?: string;
}

export interface VoiceProcessResponse {
  success: boolean;
  data?: VoiceParsedData & { transcript: string };
  vehicle?: Vehicle;
  error?: string;
}

// Notification types
export type NotificationType =
  | 'oil_change_due'
  | 'minor_service_due'
  | 'major_service_due'
  | 'invoice_ready'
  | 'overdue_service'
  | 'service_reminder'
  | 'appointment_reminder'
  | 'service_complete';

export type NotificationUserType = 'customer' | 'mechanic' | 'admin';

export interface Notification {
  id: string;
  user_id: string;
  user_type: NotificationUserType;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: string | null;
  read: number;
  read_at: string | null;
  created_at: string;
}

export interface NotificationWithMeta extends Notification {
  parsedMetadata?: Record<string, any>;
}

export interface CreateNotificationRequest {
  user_id: string;
  user_type: NotificationUserType;
  type: NotificationType;
  title?: string;
  message: string;
  metadata?: Record<string, any>;
}

// Service Pricing types
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

export interface CreateServicePriceRequest {
  service_type: string;
  display_name: string;
  base_price: number;
  labor_hours: number;
  description?: string;
}

export interface UpdateServicePriceRequest {
  display_name?: string;
  base_price?: number;
  labor_hours?: number;
  description?: string;
  is_active?: boolean;
}

// Labor Rate types
export interface LaborRate {
  id: string;
  name: string;
  rate_per_hour: number;
  is_default: boolean;
  created_at: string;
}

export interface UpdateLaborRateRequest {
  name?: string;
  rate_per_hour?: number;
  is_default?: boolean;
}
