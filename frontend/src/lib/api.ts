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

// Insights API
import { Insight, InsightsResponse, InsightStats, InsightPriority, InsightType } from './types';

export async function getInsights(options?: {
  type?: InsightType;
  priority?: InsightPriority;
  unread?: boolean;
  limit?: number;
  offset?: number;
}): Promise<InsightsResponse> {
  const params = new URLSearchParams();
  if (options?.type) params.append('type', options.type);
  if (options?.priority) params.append('priority', options.priority);
  if (options?.unread) params.append('unread', 'true');
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));
  return fetchApi<InsightsResponse>(`/insights?${params}`);
}

export async function getInsight(id: string): Promise<Insight> {
  return fetchApi<Insight>(`/insights/${id}`);
}

export async function markInsightRead(id: string): Promise<Insight> {
  return fetchApi<Insight>(`/insights/${id}/read`, { method: 'PUT' });
}

export async function markInsightActioned(id: string): Promise<Insight> {
  return fetchApi<Insight>(`/insights/${id}/action`, { method: 'PUT' });
}

export async function dismissInsight(id: string): Promise<Insight> {
  return fetchApi<Insight>(`/insights/${id}/dismiss`, { method: 'PUT' });
}

export async function getInsightStats(): Promise<InsightStats> {
  return fetchApi<InsightStats>('/insights/stats');
}

// Agent API
export async function triggerAgentRun(agentType: string): Promise<{
  success: boolean;
  insightsCreated?: number;
  tokensUsed?: number;
  error?: string;
}> {
  return fetchApi(`/agents/run/${agentType}`, { method: 'POST' });
}

// Invoice API
import {
  Invoice,
  InvoicesResponse,
  InvoiceStats,
  CreateInvoiceRequest,
  InvoiceStatus,
  PartsResponse,
  VoiceParseResponse,
  VoiceTranscribeResponse,
  VoiceProcessResponse,
  ServiceCode,
} from './types';

export async function getInvoices(options?: {
  status?: InvoiceStatus;
  customer_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<InvoicesResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.customer_id) params.append('customer_id', options.customer_id);
  if (options?.start_date) params.append('start_date', options.start_date);
  if (options?.end_date) params.append('end_date', options.end_date);
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));
  return fetchApi<InvoicesResponse>(`/invoices?${params}`);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return fetchApi<Invoice>(`/invoices/${id}`);
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  return fetchApi<InvoiceStats>('/invoices/stats');
}

export async function createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
  return fetchApi<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface QuickInvoiceService {
  name: string;
  price: number;
  quantity?: number;
  labor_hours?: number;
}

export interface CreateQuickInvoiceRequest {
  customer_id: string;
  vehicle_id?: string;
  services: QuickInvoiceService[];
  notes?: string;
  tax_rate?: number;
  status?: InvoiceStatus;
}

export async function createQuickInvoice(data: CreateQuickInvoiceRequest): Promise<{ message: string; invoice: Invoice }> {
  return fetchApi<{ message: string; invoice: Invoice }>('/invoices/quick', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvoice(id: string, data: { status?: InvoiceStatus; notes?: string; due_date?: string }): Promise<Invoice> {
  return fetchApi<Invoice>(`/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  return fetchApi<void>(`/invoices/${id}`, { method: 'DELETE' });
}

export async function downloadInvoicePdf(id: string): Promise<Blob> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/invoices/${id}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }
  return response.blob();
}

export async function sendInvoice(id: string): Promise<{ success: boolean; message: string }> {
  return fetchApi<{ success: boolean; message: string }>(`/invoices/${id}/send`, { method: 'POST' });
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  return fetchApi<Invoice>(`/invoices/${id}/mark-paid`, { method: 'POST' });
}

// Parts API
export async function getParts(): Promise<PartsResponse> {
  return fetchApi<PartsResponse>('/parts');
}

export async function searchParts(query: string): Promise<PartsResponse> {
  return fetchApi<PartsResponse>(`/parts/search?q=${encodeURIComponent(query)}`);
}

// Voice API
export async function parseVoiceTranscript(transcript: string, vehicleId?: string): Promise<VoiceParseResponse> {
  return fetchApi<VoiceParseResponse>('/voice/parse', {
    method: 'POST',
    body: JSON.stringify({ transcript, vehicleId }),
  });
}

export async function transcribeAudio(audioBlob: Blob, filename?: string): Promise<VoiceTranscribeResponse> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('audio', audioBlob, filename || 'recording.webm');

  const response = await fetch(`${API_BASE}/voice/transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Transcription failed' }));
    throw new Error(error.error || 'Transcription failed');
  }

  return response.json();
}

export async function processVoiceAudio(audioBlob: Blob, vehicleId?: string): Promise<VoiceProcessResponse> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (vehicleId) formData.append('vehicleId', vehicleId);

  const response = await fetch(`${API_BASE}/voice/process`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Voice processing failed' }));
    throw new Error(error.error || 'Voice processing failed');
  }

  return response.json();
}

export async function getServiceCodes(): Promise<{ success: boolean; serviceCodes: ServiceCode[] }> {
  return fetchApi<{ success: boolean; serviceCodes: ServiceCode[] }>('/voice/service-codes');
}

// Customer Portal Invoice API
export async function getCustomerInvoices(vehicleId?: string): Promise<{ invoices: Invoice[] }> {
  const token = localStorage.getItem('customer_token');
  const url = vehicleId ? `/portal/invoices?vehicle_id=${vehicleId}` : '/portal/invoices';
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch invoices');
  }
  return response.json();
}

export async function downloadCustomerInvoicePdf(invoiceId: string): Promise<Blob> {
  const token = localStorage.getItem('customer_token');
  const response = await fetch(`${API_BASE}/portal/invoices/${invoiceId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }
  return response.blob();
}

// Settings API - Service Prices
import { ServicePrice, LaborRate } from './types';

export async function getServicePrices(includeInactive = false): Promise<{ success: boolean; prices: ServicePrice[] }> {
  const params = includeInactive ? '?include_inactive=true' : '';
  return fetchApi<{ success: boolean; prices: ServicePrice[] }>(`/settings/service-prices${params}`);
}

export async function getServicePrice(id: string): Promise<{ success: boolean; price: ServicePrice }> {
  return fetchApi<{ success: boolean; price: ServicePrice }>(`/settings/service-prices/${id}`);
}

export async function createServicePrice(data: {
  service_type: string;
  display_name: string;
  base_price: number;
  labor_hours: number;
  description?: string;
}): Promise<{ success: boolean; price: ServicePrice }> {
  return fetchApi<{ success: boolean; price: ServicePrice }>('/settings/service-prices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateServicePrice(
  id: string,
  data: {
    display_name?: string;
    base_price?: number;
    labor_hours?: number;
    description?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; price: ServicePrice }> {
  return fetchApi<{ success: boolean; price: ServicePrice }>(`/settings/service-prices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteServicePrice(id: string): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>(`/settings/service-prices/${id}`, {
    method: 'DELETE',
  });
}

// Settings API - Labor Rates
export async function getLaborRates(): Promise<{ success: boolean; rates: LaborRate[] }> {
  return fetchApi<{ success: boolean; rates: LaborRate[] }>('/settings/labor-rates');
}

export async function getDefaultLaborRate(): Promise<{ success: boolean; rate: LaborRate }> {
  return fetchApi<{ success: boolean; rate: LaborRate }>('/settings/labor-rates/default');
}

export async function updateLaborRate(
  id: string,
  data: { name?: string; rate_per_hour?: number; is_default?: boolean }
): Promise<{ success: boolean; rate: LaborRate }> {
  return fetchApi<{ success: boolean; rate: LaborRate }>(`/settings/labor-rates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createLaborRate(data: {
  name: string;
  rate_per_hour: number;
  is_default?: boolean;
}): Promise<{ success: boolean; rate: LaborRate }> {
  return fetchApi<{ success: boolean; rate: LaborRate }>('/settings/labor-rates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get completed services for quick invoice creation
export async function getCompletedServicesForInvoice(limit = 50): Promise<{
  services: Array<ServiceLog & {
    vehicle?: Vehicle;
    customer?: Customer;
    hasInvoice: boolean;
  }>;
}> {
  return fetchApi<{
    services: Array<ServiceLog & {
      vehicle?: Vehicle;
      customer?: Customer;
      hasInvoice: boolean;
    }>;
  }>(`/services/completed?limit=${limit}`);
}
