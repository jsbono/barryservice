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

export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
}

export interface CustomersResponse extends PaginatedResponse<Customer> {
  customers: Customer[];
}

export interface VehiclesResponse extends PaginatedResponse<Vehicle> {
  vehicles: Vehicle[];
}

export interface ServicesResponse extends PaginatedResponse<ServiceLog> {
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
