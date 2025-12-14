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
}

export interface UpdateServiceLogRequest {
  service_type?: string;
  notes?: string;
  service_date?: string;
  mileage_at_service?: number;
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
