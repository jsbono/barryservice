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
