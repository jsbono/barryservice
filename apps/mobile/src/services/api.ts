import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.motorai.com';
const AUTH_TOKEN_KEY = '@motorai_auth_token';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      // The app should detect this and redirect to login
    }
    return Promise.reject(error);
  }
);

// API Types
export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  customerId: string;
  customerName: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  mechanicId: string;
  services: ServiceItem[];
  transcript: string;
  totalAmount: number;
  status: 'pending' | 'completed' | 'invoiced';
  createdAt: string;
  completedAt?: string;
}

export interface ServiceItem {
  id: string;
  description: string;
  category: string;
  parts: Part[];
  labor: LaborItem[];
  notes?: string;
}

export interface Part {
  id: string;
  name: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LaborItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  serviceRecordId: string;
  customerId: string;
  customerName: string;
  vehicleInfo: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  dueDate: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'part' | 'labor';
}

export interface Job {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  customer: Customer;
  description: string;
  scheduledTime: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  priority: 'low' | 'normal' | 'high';
}

// API Methods
export const apiClient = {
  // Vehicle endpoints
  vehicles: {
    search: async (query: string): Promise<Vehicle[]> => {
      const response = await api.get('/vehicles/search', { params: { q: query } });
      return response.data;
    },

    getByVin: async (vin: string): Promise<Vehicle> => {
      const response = await api.get(`/vehicles/vin/${vin}`);
      return response.data;
    },

    getById: async (id: string): Promise<Vehicle> => {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    },

    getServiceHistory: async (vehicleId: string): Promise<ServiceRecord[]> => {
      const response = await api.get(`/vehicles/${vehicleId}/services`);
      return response.data;
    },
  },

  // Customer endpoints
  customers: {
    getById: async (id: string): Promise<Customer> => {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    },

    search: async (query: string): Promise<Customer[]> => {
      const response = await api.get('/customers/search', { params: { q: query } });
      return response.data;
    },
  },

  // Service endpoints
  services: {
    create: async (data: {
      vehicleId: string;
      services: ServiceItem[];
      transcript: string;
    }): Promise<ServiceRecord> => {
      const response = await api.post('/services', data);
      return response.data;
    },

    getById: async (id: string): Promise<ServiceRecord> => {
      const response = await api.get(`/services/${id}`);
      return response.data;
    },

    update: async (id: string, data: Partial<ServiceRecord>): Promise<ServiceRecord> => {
      const response = await api.patch(`/services/${id}`, data);
      return response.data;
    },

    complete: async (id: string): Promise<ServiceRecord> => {
      const response = await api.post(`/services/${id}/complete`);
      return response.data;
    },
  },

  // Invoice endpoints
  invoices: {
    list: async (params?: { status?: string; page?: number; limit?: number }): Promise<{
      invoices: Invoice[];
      total: number;
      page: number;
      totalPages: number;
    }> => {
      const response = await api.get('/invoices', { params });
      return response.data;
    },

    getById: async (id: string): Promise<Invoice> => {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    },

    create: async (serviceRecordId: string): Promise<Invoice> => {
      const response = await api.post('/invoices', { serviceRecordId });
      return response.data;
    },

    send: async (id: string): Promise<Invoice> => {
      const response = await api.post(`/invoices/${id}/send`);
      return response.data;
    },

    markPaid: async (id: string): Promise<Invoice> => {
      const response = await api.post(`/invoices/${id}/mark-paid`);
      return response.data;
    },
  },

  // Job/Schedule endpoints
  jobs: {
    getToday: async (): Promise<Job[]> => {
      const response = await api.get('/jobs/today');
      return response.data;
    },

    getUpcoming: async (): Promise<Job[]> => {
      const response = await api.get('/jobs/upcoming');
      return response.data;
    },

    getById: async (id: string): Promise<Job> => {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    },

    updateStatus: async (id: string, status: Job['status']): Promise<Job> => {
      const response = await api.patch(`/jobs/${id}/status`, { status });
      return response.data;
    },
  },

  // Dashboard stats
  dashboard: {
    getStats: async (): Promise<{
      todayJobsCount: number;
      pendingInvoicesCount: number;
      totalRevenueToday: number;
      completedJobsToday: number;
    }> => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },

    getRecentInvoices: async (limit?: number): Promise<Invoice[]> => {
      const response = await api.get('/dashboard/recent-invoices', {
        params: { limit: limit || 5 },
      });
      return response.data;
    },
  },
};

export default api;
