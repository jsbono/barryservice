/**
 * Vehicle Intelligence Engine for MotorAI
 *
 * Provides VIN decoding using NHTSA vPIC API and intelligent service schedule recommendations
 * based on vehicle type, age, and manufacturer guidelines.
 */

import * as ServiceScheduleModel from '../models/ServiceSchedule.js';

// NHTSA vPIC API base URL
const NHTSA_API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// VIN decode response types
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
  rawResults: NHTSAResult[];
  success: boolean;
  errorMessage?: string;
}

interface NHTSAResult {
  Variable: string;
  Value: string | null;
  ValueId: string | null;
  VariableId: number;
}

interface NHTSAResponse {
  Count: number;
  Message: string;
  Results: NHTSAResult[];
  SearchCriteria: string;
}

// Service interval configuration
export interface ServiceIntervalConfig {
  oilChangeMiles: number;
  oilChangeMonths: number;
  minorServiceMiles: number;
  minorServiceMonths: number;
  majorServiceMiles: number;
  majorServiceMonths: number;
}

export type VehicleCategory = 'truck' | 'suv' | 'sedan' | 'hybrid' | 'electric' | 'van' | 'sports' | 'luxury' | 'unknown';

/**
 * Decode a VIN using the NHTSA vPIC API
 *
 * @param vin The Vehicle Identification Number to decode
 * @returns Promise containing decoded vehicle information
 */
export async function decodeVIN(vin: string): Promise<VINDecodeResult> {
  // Validate VIN format (17 characters, alphanumeric excluding I, O, Q)
  const cleanVin = vin.toUpperCase().trim();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
    return {
      vin: cleanVin,
      make: null,
      model: null,
      year: null,
      engineModel: null,
      fuelType: null,
      driveType: null,
      vehicleType: null,
      bodyClass: null,
      rawResults: [],
      success: false,
      errorMessage: 'Invalid VIN format. VIN must be 17 characters (letters and numbers, excluding I, O, Q)',
    };
  }

  try {
    const url = `${NHTSA_API_BASE}/DecodeVin/${cleanVin}?format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NHTSA API returned status ${response.status}`);
    }

    const data = await response.json() as NHTSAResponse;

    // Extract values from results
    const getValue = (variableName: string): string | null => {
      const result = data.Results.find(r => r.Variable === variableName);
      return result?.Value || null;
    };

    const getNumberValue = (variableName: string): number | null => {
      const value = getValue(variableName);
      if (value) {
        const num = parseInt(value, 10);
        return isNaN(num) ? null : num;
      }
      return null;
    };

    // Check for error codes in the results
    const errorCode = getValue('Error Code');
    const errorText = getValue('Error Text');

    // Error codes 0 and 1 are acceptable (0 = no error, 1 = minor issues but data available)
    const hasData = getValue('Make') || getValue('Model') || getValue('Model Year');

    if (!hasData && errorCode && errorCode !== '0') {
      return {
        vin: cleanVin,
        make: null,
        model: null,
        year: null,
        engineModel: null,
        fuelType: null,
        driveType: null,
        vehicleType: null,
        bodyClass: null,
        rawResults: data.Results,
        success: false,
        errorMessage: errorText || `VIN decode failed with error code ${errorCode}`,
      };
    }

    return {
      vin: cleanVin,
      make: getValue('Make'),
      model: getValue('Model'),
      year: getNumberValue('Model Year'),
      engineModel: getValue('Engine Model'),
      fuelType: getValue('Fuel Type - Primary'),
      driveType: getValue('Drive Type'),
      vehicleType: getValue('Vehicle Type'),
      bodyClass: getValue('Body Class'),
      rawResults: data.Results,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      vin: cleanVin,
      make: null,
      model: null,
      year: null,
      engineModel: null,
      fuelType: null,
      driveType: null,
      vehicleType: null,
      bodyClass: null,
      rawResults: [],
      success: false,
      errorMessage: `Failed to decode VIN: ${errorMessage}`,
    };
  }
}

/**
 * Determine the vehicle category based on body class, vehicle type, and fuel type
 */
export function determineVehicleCategory(
  bodyClass: string | null,
  vehicleType: string | null,
  fuelType: string | null
): VehicleCategory {
  const bodyLower = (bodyClass || '').toLowerCase();
  const typeLower = (vehicleType || '').toLowerCase();
  const fuelLower = (fuelType || '').toLowerCase();

  // Check for electric/hybrid first
  if (fuelLower.includes('electric') && !fuelLower.includes('hybrid')) {
    return 'electric';
  }
  if (fuelLower.includes('hybrid') || fuelLower.includes('plug-in')) {
    return 'hybrid';
  }

  // Check body class / vehicle type
  if (bodyLower.includes('truck') || typeLower.includes('truck')) {
    return 'truck';
  }
  if (bodyLower.includes('suv') || bodyLower.includes('sport utility') ||
      typeLower.includes('sport utility') || typeLower.includes('multipurpose')) {
    return 'suv';
  }
  if (bodyLower.includes('van') || typeLower.includes('van')) {
    return 'van';
  }
  if (bodyLower.includes('convertible') || bodyLower.includes('coupe') ||
      bodyLower.includes('roadster') || bodyLower.includes('sports')) {
    return 'sports';
  }
  if (bodyLower.includes('sedan') || bodyLower.includes('hatchback') ||
      bodyLower.includes('wagon') || typeLower.includes('passenger')) {
    return 'sedan';
  }

  return 'unknown';
}

/**
 * Get recommended service intervals based on vehicle category and age
 *
 * These intervals are based on general manufacturer recommendations and industry standards:
 * - Electric vehicles need less frequent service (no oil changes)
 * - Hybrids have modified service schedules
 * - Trucks and SUVs often need more frequent service due to heavier use
 * - Older vehicles may need more frequent maintenance
 */
export function getServiceIntervals(
  category: VehicleCategory,
  vehicleYear?: number | null
): ServiceIntervalConfig {
  const currentYear = new Date().getFullYear();
  const vehicleAge = vehicleYear ? currentYear - vehicleYear : 0;

  // Base intervals vary by vehicle category
  const baseIntervals: Record<VehicleCategory, ServiceIntervalConfig> = {
    electric: {
      oilChangeMiles: 0, // No oil in electric vehicles
      oilChangeMonths: 0,
      minorServiceMiles: 15000, // Tire rotation, brake check, fluid top-off
      minorServiceMonths: 12,
      majorServiceMiles: 75000, // Battery inspection, coolant, brake system
      majorServiceMonths: 48,
    },
    hybrid: {
      oilChangeMiles: 10000, // Hybrids are easier on the engine
      oilChangeMonths: 12,
      minorServiceMiles: 20000,
      minorServiceMonths: 18,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
    truck: {
      oilChangeMiles: 5000, // More frequent due to harder use
      oilChangeMonths: 6,
      minorServiceMiles: 15000,
      minorServiceMonths: 12,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
    suv: {
      oilChangeMiles: 6000,
      oilChangeMonths: 6,
      minorServiceMiles: 18000,
      minorServiceMonths: 12,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
    van: {
      oilChangeMiles: 5000,
      oilChangeMonths: 6,
      minorServiceMiles: 15000,
      minorServiceMonths: 12,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
    sports: {
      oilChangeMiles: 5000, // Performance vehicles need more attention
      oilChangeMonths: 6,
      minorServiceMiles: 15000,
      minorServiceMonths: 12,
      majorServiceMiles: 50000,
      majorServiceMonths: 30,
    },
    luxury: {
      oilChangeMiles: 7500,
      oilChangeMonths: 12,
      minorServiceMiles: 20000,
      minorServiceMonths: 18,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
    sedan: {
      oilChangeMiles: 7500,
      oilChangeMonths: 12,
      minorServiceMiles: 20000,
      minorServiceMonths: 18,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
    unknown: {
      oilChangeMiles: 5000, // Conservative defaults
      oilChangeMonths: 6,
      minorServiceMiles: 15000,
      minorServiceMonths: 12,
      majorServiceMiles: 60000,
      majorServiceMonths: 36,
    },
  };

  const intervals = { ...baseIntervals[category] };

  // Adjust for older vehicles (more than 10 years old need more frequent service)
  if (vehicleAge > 10) {
    // Reduce mileage intervals by 20% for older vehicles
    if (intervals.oilChangeMiles > 0) {
      intervals.oilChangeMiles = Math.round(intervals.oilChangeMiles * 0.8);
    }
    intervals.minorServiceMiles = Math.round(intervals.minorServiceMiles * 0.8);
    intervals.majorServiceMiles = Math.round(intervals.majorServiceMiles * 0.8);
  } else if (vehicleAge > 5) {
    // Reduce by 10% for vehicles 5-10 years old
    if (intervals.oilChangeMiles > 0) {
      intervals.oilChangeMiles = Math.round(intervals.oilChangeMiles * 0.9);
    }
    intervals.minorServiceMiles = Math.round(intervals.minorServiceMiles * 0.9);
    intervals.majorServiceMiles = Math.round(intervals.majorServiceMiles * 0.9);
  }

  return intervals;
}

/**
 * Create a service schedule for a vehicle based on its decoded VIN information
 *
 * @param vehicleId The ID of the vehicle
 * @param vinInfo Decoded VIN information
 * @param lastServiceDate Optional last service date (defaults to today)
 * @param currentMileage Optional current mileage
 * @returns The created service schedule
 */
export function createServiceScheduleForVehicle(
  vehicleId: string,
  vinInfo: VINDecodeResult,
  lastServiceDate?: Date,
  currentMileage?: number
): ServiceScheduleModel.ServiceSchedule {
  // Determine vehicle category
  const category = determineVehicleCategory(
    vinInfo.bodyClass,
    vinInfo.vehicleType,
    vinInfo.fuelType
  );

  // Get recommended intervals
  const intervals = getServiceIntervals(category, vinInfo.year);

  // Calculate next service dates
  const baseDate = lastServiceDate || new Date();

  // Oil change date (if applicable)
  let nextOilChangeDate: Date | null = null;
  let nextOilChangeMileage: number | null = null;
  if (intervals.oilChangeMiles > 0 && intervals.oilChangeMonths > 0) {
    nextOilChangeDate = new Date(baseDate);
    nextOilChangeDate.setMonth(nextOilChangeDate.getMonth() + intervals.oilChangeMonths);
    if (currentMileage) {
      nextOilChangeMileage = currentMileage + intervals.oilChangeMiles;
    }
  }

  // Minor service date
  const nextMinorServiceDate = new Date(baseDate);
  nextMinorServiceDate.setMonth(nextMinorServiceDate.getMonth() + intervals.minorServiceMonths);
  const nextMinorServiceMileage = currentMileage
    ? currentMileage + intervals.minorServiceMiles
    : null;

  // Major service date
  const nextMajorServiceDate = new Date(baseDate);
  nextMajorServiceDate.setMonth(nextMajorServiceDate.getMonth() + intervals.majorServiceMonths);
  const nextMajorServiceMileage = currentMileage
    ? currentMileage + intervals.majorServiceMiles
    : null;

  // Store interval config as JSON
  const intervalConfig = JSON.stringify(intervals);

  // Check if schedule already exists
  const existingSchedule = ServiceScheduleModel.findByVehicleId(vehicleId);

  if (existingSchedule) {
    // Update existing schedule
    return ServiceScheduleModel.update(existingSchedule.id, {
      vehicle_category: category,
      oil_change_interval_miles: intervals.oilChangeMiles > 0 ? intervals.oilChangeMiles : null,
      oil_change_interval_months: intervals.oilChangeMonths > 0 ? intervals.oilChangeMonths : null,
      minor_service_interval_miles: intervals.minorServiceMiles,
      minor_service_interval_months: intervals.minorServiceMonths,
      major_service_interval_miles: intervals.majorServiceMiles,
      major_service_interval_months: intervals.majorServiceMonths,
      next_oil_change_date: nextOilChangeDate?.toISOString().split('T')[0] || null,
      next_oil_change_mileage: nextOilChangeMileage,
      next_minor_service_date: nextMinorServiceDate.toISOString().split('T')[0],
      next_minor_service_mileage: nextMinorServiceMileage,
      next_major_service_date: nextMajorServiceDate.toISOString().split('T')[0],
      next_major_service_mileage: nextMajorServiceMileage,
      interval_config: intervalConfig,
    })!;
  }

  // Create new schedule
  return ServiceScheduleModel.create({
    vehicle_id: vehicleId,
    vehicle_category: category,
    last_service_date: baseDate.toISOString().split('T')[0],
    last_service_mileage: currentMileage || null,
    oil_change_interval_miles: intervals.oilChangeMiles > 0 ? intervals.oilChangeMiles : null,
    oil_change_interval_months: intervals.oilChangeMonths > 0 ? intervals.oilChangeMonths : null,
    minor_service_interval_miles: intervals.minorServiceMiles,
    minor_service_interval_months: intervals.minorServiceMonths,
    major_service_interval_miles: intervals.majorServiceMiles,
    major_service_interval_months: intervals.majorServiceMonths,
    next_oil_change_date: nextOilChangeDate?.toISOString().split('T')[0] || null,
    next_oil_change_mileage: nextOilChangeMileage,
    next_minor_service_date: nextMinorServiceDate.toISOString().split('T')[0],
    next_minor_service_mileage: nextMinorServiceMileage,
    next_major_service_date: nextMajorServiceDate.toISOString().split('T')[0],
    next_major_service_mileage: nextMajorServiceMileage,
    interval_config: intervalConfig,
  });
}

/**
 * Update service schedule after a service is performed
 *
 * @param vehicleId The vehicle ID
 * @param serviceType Type of service performed ('oil_change', 'minor', 'major')
 * @param serviceDate Date the service was performed
 * @param mileageAtService Mileage at time of service
 */
export function updateScheduleAfterService(
  vehicleId: string,
  serviceType: 'oil_change' | 'minor' | 'major',
  serviceDate: Date,
  mileageAtService?: number
): ServiceScheduleModel.ServiceSchedule | null {
  const schedule = ServiceScheduleModel.findByVehicleId(vehicleId);
  if (!schedule) {
    return null;
  }

  const updates: Partial<ServiceScheduleModel.UpdateServiceScheduleRequest> = {
    last_service_date: serviceDate.toISOString().split('T')[0],
    last_service_mileage: mileageAtService || null,
  };

  switch (serviceType) {
    case 'oil_change':
      if (schedule.oil_change_interval_months) {
        const nextDate = new Date(serviceDate);
        nextDate.setMonth(nextDate.getMonth() + schedule.oil_change_interval_months);
        updates.next_oil_change_date = nextDate.toISOString().split('T')[0];
      }
      if (schedule.oil_change_interval_miles && mileageAtService) {
        updates.next_oil_change_mileage = mileageAtService + schedule.oil_change_interval_miles;
      }
      break;

    case 'minor':
      if (schedule.minor_service_interval_months) {
        const nextDate = new Date(serviceDate);
        nextDate.setMonth(nextDate.getMonth() + schedule.minor_service_interval_months);
        updates.next_minor_service_date = nextDate.toISOString().split('T')[0];
      }
      if (schedule.minor_service_interval_miles && mileageAtService) {
        updates.next_minor_service_mileage = mileageAtService + schedule.minor_service_interval_miles;
      }
      break;

    case 'major':
      if (schedule.major_service_interval_months) {
        const nextDate = new Date(serviceDate);
        nextDate.setMonth(nextDate.getMonth() + schedule.major_service_interval_months);
        updates.next_major_service_date = nextDate.toISOString().split('T')[0];
      }
      if (schedule.major_service_interval_miles && mileageAtService) {
        updates.next_major_service_mileage = mileageAtService + schedule.major_service_interval_miles;
      }
      break;
  }

  return ServiceScheduleModel.update(schedule.id, updates);
}

/**
 * Get upcoming services for a vehicle
 *
 * @param vehicleId The vehicle ID
 * @param currentMileage Current vehicle mileage (optional)
 * @returns Array of upcoming services with dates and urgency
 */
export interface UpcomingService {
  type: 'oil_change' | 'minor_service' | 'major_service';
  dueDate: string | null;
  dueMileage: number | null;
  urgency: 'overdue' | 'urgent' | 'upcoming' | 'scheduled';
  daysUntilDue: number | null;
  milesUntilDue: number | null;
}

export function getUpcomingServices(
  vehicleId: string,
  currentMileage?: number
): UpcomingService[] {
  const schedule = ServiceScheduleModel.findByVehicleId(vehicleId);
  if (!schedule) {
    return [];
  }

  const today = new Date();
  const services: UpcomingService[] = [];

  const calculateUrgency = (
    dueDate: string | null,
    dueMileage: number | null
  ): { urgency: UpcomingService['urgency']; daysUntilDue: number | null; milesUntilDue: number | null } => {
    let daysUntilDue: number | null = null;
    let milesUntilDue: number | null = null;
    let urgency: UpcomingService['urgency'] = 'scheduled';

    if (dueDate) {
      const due = new Date(dueDate);
      daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue < 0) {
        urgency = 'overdue';
      } else if (daysUntilDue <= 7) {
        urgency = 'urgent';
      } else if (daysUntilDue <= 30) {
        urgency = 'upcoming';
      }
    }

    if (dueMileage && currentMileage) {
      milesUntilDue = dueMileage - currentMileage;

      if (milesUntilDue < 0) {
        urgency = 'overdue';
      } else if (milesUntilDue <= 500 && urgency !== 'overdue') {
        urgency = 'urgent';
      } else if (milesUntilDue <= 1000 && urgency === 'scheduled') {
        urgency = 'upcoming';
      }
    }

    return { urgency, daysUntilDue, milesUntilDue };
  };

  // Oil change (if applicable)
  if (schedule.next_oil_change_date || schedule.next_oil_change_mileage) {
    const { urgency, daysUntilDue, milesUntilDue } = calculateUrgency(
      schedule.next_oil_change_date,
      schedule.next_oil_change_mileage
    );
    services.push({
      type: 'oil_change',
      dueDate: schedule.next_oil_change_date,
      dueMileage: schedule.next_oil_change_mileage,
      urgency,
      daysUntilDue,
      milesUntilDue,
    });
  }

  // Minor service
  if (schedule.next_minor_service_date || schedule.next_minor_service_mileage) {
    const { urgency, daysUntilDue, milesUntilDue } = calculateUrgency(
      schedule.next_minor_service_date,
      schedule.next_minor_service_mileage
    );
    services.push({
      type: 'minor_service',
      dueDate: schedule.next_minor_service_date,
      dueMileage: schedule.next_minor_service_mileage,
      urgency,
      daysUntilDue,
      milesUntilDue,
    });
  }

  // Major service
  if (schedule.next_major_service_date || schedule.next_major_service_mileage) {
    const { urgency, daysUntilDue, milesUntilDue } = calculateUrgency(
      schedule.next_major_service_date,
      schedule.next_major_service_mileage
    );
    services.push({
      type: 'major_service',
      dueDate: schedule.next_major_service_date,
      dueMileage: schedule.next_major_service_mileage,
      urgency,
      daysUntilDue,
      milesUntilDue,
    });
  }

  // Sort by urgency (overdue first, then urgent, upcoming, scheduled)
  const urgencyOrder = { overdue: 0, urgent: 1, upcoming: 2, scheduled: 3 };
  services.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return services;
}
