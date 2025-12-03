import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CustomerUser } from './types';
import { customerLogin as apiCustomerLogin, getCustomerMe } from './api';

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CUSTOMER_TOKEN_KEY = 'customer_token';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (token) {
      // Temporarily set the token for API calls
      const regularToken = localStorage.getItem('token');
      localStorage.setItem('token', token);

      getCustomerMe()
        .then((customerData) => {
          setCustomer(customerData);
        })
        .catch(() => {
          localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        })
        .finally(() => {
          // Restore regular token if it existed
          if (regularToken) {
            localStorage.setItem('token', regularToken);
          } else {
            localStorage.removeItem('token');
          }
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiCustomerLogin(email, password);
    localStorage.setItem(CUSTOMER_TOKEN_KEY, response.token);
    setCustomer(response.customer);
  };

  const logout = () => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoading,
        login,
        logout,
        isAuthenticated: !!customer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}

// Custom fetch wrapper for customer portal that uses customer token
export function useCustomerApi() {
  const fetchWithCustomerToken = async <T,>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
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
  };

  return { fetchWithCustomerToken };
}
