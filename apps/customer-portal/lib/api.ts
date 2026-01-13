import { supabase, Customer, Vehicle, Service, Invoice, InvoiceItem } from './supabase';

// API Base URL - would be set via environment variable in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with auth headers
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Customer API
export const customerApi = {
  getProfile: async () => {
    return fetchWithAuth<Customer>('/customer/profile');
  },

  updateProfile: async (updates: Partial<Customer>) => {
    return fetchWithAuth<Customer>('/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  updateNotificationPreferences: async (preferences: {
    email: boolean;
    sms: boolean;
    serviceReminders: boolean;
    promotions: boolean;
  }) => {
    return fetchWithAuth<{ success: boolean }>('/customer/notifications', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  },
};

// Vehicles API
export const vehiclesApi = {
  getAll: async () => {
    return fetchWithAuth<Vehicle[]>('/vehicles');
  },

  getById: async (id: string) => {
    return fetchWithAuth<Vehicle>(`/vehicles/${id}`);
  },

  getServiceHistory: async (vehicleId: string) => {
    return fetchWithAuth<Service[]>(`/vehicles/${vehicleId}/services`);
  },

  create: async (vehicle: Omit<Vehicle, 'id' | 'customer_id' | 'created_at' | 'updated_at'>) => {
    return fetchWithAuth<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  },

  update: async (id: string, updates: Partial<Vehicle>) => {
    return fetchWithAuth<Vehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return fetchWithAuth<{ success: boolean }>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Services API
export const servicesApi = {
  getAll: async () => {
    return fetchWithAuth<Service[]>('/services');
  },

  getById: async (id: string) => {
    return fetchWithAuth<Service>(`/services/${id}`);
  },

  getUpcoming: async () => {
    return fetchWithAuth<Service[]>('/services/upcoming');
  },

  schedule: async (serviceData: {
    vehicleId: string;
    serviceType: string;
    scheduledDate: string;
    notes?: string;
  }) => {
    return fetchWithAuth<Service>('/services/schedule', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },
};

// Invoices API
export const invoicesApi = {
  getAll: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const queryString = searchParams.toString();
    return fetchWithAuth<Invoice[]>(`/invoices${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return fetchWithAuth<Invoice & { items: InvoiceItem[] }>(`/invoices/${id}`);
  },

  downloadPdf: async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
        headers: {
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  pay: async (id: string, paymentMethod: string) => {
    return fetchWithAuth<Invoice>(`/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  },
};

// Dashboard API
export const dashboardApi = {
  getSummary: async () => {
    return fetchWithAuth<{
      vehicleCount: number;
      totalServices: number;
      pendingInvoices: number;
      upcomingServices: number;
      recentInvoices: Invoice[];
      upcomingServicesList: Service[];
    }>('/dashboard/summary');
  },
};

// Export all APIs
export const api = {
  customer: customerApi,
  vehicles: vehiclesApi,
  services: servicesApi,
  invoices: invoicesApi,
  dashboard: dashboardApi,
};

export default api;
