import {
  Customer,
  CustomersResponse,
  Vehicle,
  VehiclesResponse,
  ServiceLog,
  ServicesResponse,
  ServiceRecommendation,
  LoginResponse,
  CreateCustomerRequest,
  CreateVehicleRequest,
  CreateServiceLogRequest,
} from './types';

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth API
export async function login(email: string, password: string): Promise<LoginResponse> {
  return fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ id: string; email: string; role: string }> {
  return fetchApi('/auth/me');
}

// Customers API
export async function getCustomers(limit = 100, offset = 0): Promise<CustomersResponse> {
  return fetchApi<CustomersResponse>(`/customers?limit=${limit}&offset=${offset}`);
}

export async function getCustomer(id: string): Promise<Customer> {
  return fetchApi<Customer>(`/customers/${id}`);
}

export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  return fetchApi<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> {
  return fetchApi<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  return fetchApi<void>(`/customers/${id}`, {
    method: 'DELETE',
  });
}

// Vehicles API
export async function getVehicles(customerId?: string, limit = 100, offset = 0): Promise<VehiclesResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (customerId) params.append('customer_id', customerId);
  return fetchApi<VehiclesResponse>(`/vehicles?${params}`);
}

export async function getVehicle(id: string): Promise<Vehicle> {
  return fetchApi<Vehicle>(`/vehicles/${id}`);
}

export async function createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
  return fetchApi<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVehicle(id: string, data: Partial<CreateVehicleRequest>): Promise<Vehicle> {
  return fetchApi<Vehicle>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  return fetchApi<void>(`/vehicles/${id}`, {
    method: 'DELETE',
  });
}

// Services API
export async function getServices(vehicleId?: string, limit = 100, offset = 0): Promise<ServicesResponse> {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (vehicleId) params.append('vehicle_id', vehicleId);
  return fetchApi<ServicesResponse>(`/services?${params}`);
}

export async function getUpcomingServices(): Promise<{ services: ServiceLog[] }> {
  return fetchApi<{ services: ServiceLog[] }>('/services/upcoming');
}

export async function getRecentActivity(limit = 10): Promise<{ services: ServiceLog[] }> {
  return fetchApi<{ services: ServiceLog[] }>(`/services/recent?limit=${limit}`);
}

export interface ExpectedService {
  vehicle_id: string;
  vehicle_info: string;
  customer_name: string;
  customer_email: string;
  current_mileage: number | null;
  service_name: string;
  category: 'minor' | 'major';
  recommended_mileage: number;
  recommended_months: number;
  next_due_mileage: number;
  miles_until_due: number | null;
  status: 'overdue' | 'due_soon' | 'upcoming';
  priority: number;
  last_service_date: string | null;
  last_service_mileage: number | null;
}

export interface ExpectedServicesResponse {
  services: ExpectedService[];
  summary: {
    overdue: number;
    due_soon: number;
    upcoming: number;
    total: number;
  };
}

export async function getExpectedServices(status?: 'due', limit = 50): Promise<ExpectedServicesResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.append('status', status);
  return fetchApi<ExpectedServicesResponse>(`/services/expected?${params}`);
}

export async function getService(id: string): Promise<ServiceLog> {
  return fetchApi<ServiceLog>(`/services/${id}`);
}

export async function createServiceLog(data: CreateServiceLogRequest): Promise<ServiceLog> {
  return fetchApi<ServiceLog>('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateServiceLog(id: string, data: Partial<CreateServiceLogRequest>): Promise<ServiceLog> {
  return fetchApi<ServiceLog>(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Public Lookup API
export async function getMakes(): Promise<{ makes: string[] }> {
  return fetchApi<{ makes: string[] }>('/lookup/makes');
}

export async function getModels(make: string): Promise<{ models: string[] }> {
  return fetchApi<{ models: string[] }>(`/lookup/models?make=${encodeURIComponent(make)}`);
}

export async function getYears(make: string, model: string): Promise<{ years: number[] }> {
  return fetchApi<{ years: number[] }>(`/lookup/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
}

export async function getServiceRecommendations(
  make: string,
  model: string,
  year: number
): Promise<{ services: ServiceRecommendation[] }> {
  return fetchApi<{ services: ServiceRecommendation[] }>(
    `/lookup/services?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`
  );
}

// Automation API
export async function triggerReminders(): Promise<{ message: string; sent: number; skipped: number; errors: number }> {
  return fetchApi('/automation/trigger', { method: 'POST' });
}

// Customer Portal API
import {
  CustomerLoginResponse,
  CustomerUser,
  PortalVehicle,
  PortalServiceLog,
  PortalRecommendedService,
  PortalScheduledService,
} from './types';

export async function customerLogin(email: string, password: string): Promise<CustomerLoginResponse> {
  return fetchApi<CustomerLoginResponse>('/portal/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getCustomerMe(): Promise<CustomerUser> {
  return fetchApi<CustomerUser>('/portal/me');
}

export async function getCustomerVehicles(): Promise<{ vehicles: PortalVehicle[] }> {
  return fetchApi<{ vehicles: PortalVehicle[] }>('/portal/me/vehicles');
}

export async function getCustomerVehicle(vehicleId: string): Promise<{ vehicle: PortalVehicle }> {
  return fetchApi<{ vehicle: PortalVehicle }>(`/portal/vehicle/${vehicleId}`);
}

export async function getCustomerVehicleServices(vehicleId: string): Promise<{ services: PortalServiceLog[] }> {
  return fetchApi<{ services: PortalServiceLog[] }>(`/portal/vehicle/${vehicleId}/services`);
}

export async function getCustomerVehicleRecommended(vehicleId: string): Promise<{ recommended: PortalRecommendedService[] }> {
  return fetchApi<{ recommended: PortalRecommendedService[] }>(`/portal/vehicle/${vehicleId}/recommended`);
}

export async function getCustomerVehicleScheduled(vehicleId: string): Promise<{ scheduled: PortalScheduledService[] }> {
  return fetchApi<{ scheduled: PortalScheduledService[] }>(`/portal/vehicle/${vehicleId}/scheduled`);
}

// Set customer password (mechanic dashboard)
export async function setCustomerPassword(customerId: string, password: string): Promise<{ success: boolean; message: string }> {
  return fetchApi<{ success: boolean; message: string }>(`/customers/${customerId}/set-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}
