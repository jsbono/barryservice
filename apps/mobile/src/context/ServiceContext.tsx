import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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

export interface ServiceItem {
  id: string;
  description: string;
  category: string;
  parts: Part[];
  labor: LaborItem[];
  notes?: string;
}

export interface ServiceSession {
  id: string;
  vehicle: Vehicle | null;
  customer: Customer | null;
  services: ServiceItem[];
  transcript: string;
  rawAudioUri?: string;
  status: 'draft' | 'processing' | 'ready' | 'confirmed';
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceContextType {
  currentSession: ServiceSession | null;
  isRecording: boolean;
  liveTranscript: string;

  // Session management
  startNewSession: () => void;
  setVehicle: (vehicle: Vehicle) => void;
  setCustomer: (customer: Customer) => void;
  updateTranscript: (transcript: string) => void;
  updateLiveTranscript: (transcript: string) => void;
  setServices: (services: ServiceItem[]) => void;
  updateService: (serviceId: string, updates: Partial<ServiceItem>) => void;
  removeService: (serviceId: string) => void;
  addPart: (serviceId: string, part: Part) => void;
  updatePart: (serviceId: string, partId: string, updates: Partial<Part>) => void;
  removePart: (serviceId: string, partId: string) => void;
  setSessionStatus: (status: ServiceSession['status']) => void;
  setRecording: (isRecording: boolean) => void;
  clearSession: () => void;

  // Computed values
  getTotalPartsAmount: () => number;
  getTotalLaborAmount: () => number;
  getGrandTotal: () => number;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const createEmptySession = (): ServiceSession => ({
  id: `session_${Date.now()}`,
  vehicle: null,
  customer: null,
  services: [],
  transcript: '',
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ServiceSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const startNewSession = useCallback(() => {
    setCurrentSession(createEmptySession());
    setLiveTranscript('');
  }, []);

  const setVehicle = useCallback((vehicle: Vehicle) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        vehicle,
        customer: {
          id: vehicle.customerId,
          name: vehicle.customerName,
          email: '',
          phone: '',
        },
        updatedAt: new Date(),
      };
    });
  }, []);

  const setCustomer = useCallback((customer: Customer) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, customer, updatedAt: new Date() };
    });
  }, []);

  const updateTranscript = useCallback((transcript: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, transcript, updatedAt: new Date() };
    });
  }, []);

  const updateLiveTranscript = useCallback((transcript: string) => {
    setLiveTranscript(transcript);
  }, []);

  const setServices = useCallback((services: ServiceItem[]) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, services, updatedAt: new Date() };
    });
  }, []);

  const updateService = useCallback((serviceId: string, updates: Partial<ServiceItem>) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map(s =>
          s.id === serviceId ? { ...s, ...updates } : s
        ),
        updatedAt: new Date(),
      };
    });
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.filter(s => s.id !== serviceId),
        updatedAt: new Date(),
      };
    });
  }, []);

  const addPart = useCallback((serviceId: string, part: Part) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map(s =>
          s.id === serviceId
            ? { ...s, parts: [...s.parts, part] }
            : s
        ),
        updatedAt: new Date(),
      };
    });
  }, []);

  const updatePart = useCallback((serviceId: string, partId: string, updates: Partial<Part>) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map(s =>
          s.id === serviceId
            ? {
                ...s,
                parts: s.parts.map(p =>
                  p.id === partId ? { ...p, ...updates } : p
                ),
              }
            : s
        ),
        updatedAt: new Date(),
      };
    });
  }, []);

  const removePart = useCallback((serviceId: string, partId: string) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.map(s =>
          s.id === serviceId
            ? { ...s, parts: s.parts.filter(p => p.id !== partId) }
            : s
        ),
        updatedAt: new Date(),
      };
    });
  }, []);

  const setSessionStatus = useCallback((status: ServiceSession['status']) => {
    setCurrentSession(prev => {
      if (!prev) return prev;
      return { ...prev, status, updatedAt: new Date() };
    });
  }, []);

  const setRecording = useCallback((recording: boolean) => {
    setIsRecording(recording);
  }, []);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setLiveTranscript('');
    setIsRecording(false);
  }, []);

  const getTotalPartsAmount = useCallback(() => {
    if (!currentSession) return 0;
    return currentSession.services.reduce((total, service) => {
      return total + service.parts.reduce((partTotal, part) => partTotal + part.totalPrice, 0);
    }, 0);
  }, [currentSession]);

  const getTotalLaborAmount = useCallback(() => {
    if (!currentSession) return 0;
    return currentSession.services.reduce((total, service) => {
      return total + service.labor.reduce((laborTotal, labor) => laborTotal + labor.totalPrice, 0);
    }, 0);
  }, [currentSession]);

  const getGrandTotal = useCallback(() => {
    return getTotalPartsAmount() + getTotalLaborAmount();
  }, [getTotalPartsAmount, getTotalLaborAmount]);

  return (
    <ServiceContext.Provider
      value={{
        currentSession,
        isRecording,
        liveTranscript,
        startNewSession,
        setVehicle,
        setCustomer,
        updateTranscript,
        updateLiveTranscript,
        setServices,
        updateService,
        removeService,
        addPart,
        updatePart,
        removePart,
        setSessionStatus,
        setRecording,
        clearSession,
        getTotalPartsAmount,
        getTotalLaborAmount,
        getGrandTotal,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useService = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
};

export default ServiceContext;
