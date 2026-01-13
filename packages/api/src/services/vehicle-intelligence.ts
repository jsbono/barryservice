/**
 * Vehicle Intelligence Service
 *
 * Provides intelligent service recommendations based on vehicle data,
 * mileage, and service history.
 */

export interface ServiceInterval {
  serviceType: string;
  mileageInterval: number; // miles between services
  timeInterval: number; // days between services
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost?: {
    labor: number;
    parts: number;
  };
}

export interface ServiceRecommendation {
  serviceType: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueByDate?: Date;
  dueByMileage?: number;
  overdue: boolean;
  overdueBy?: {
    days?: number;
    miles?: number;
  };
  estimatedCost?: {
    labor: number;
    parts: number;
    total: number;
  };
}

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  mileage: number;
  engineType?: string;
  transmission?: string;
}

export interface ServiceHistory {
  serviceType: string;
  serviceDate: Date;
  mileageAtService: number;
}

/**
 * Standard service intervals based on manufacturer recommendations
 * These can be overridden per make/model
 */
const STANDARD_SERVICE_INTERVALS: ServiceInterval[] = [
  {
    serviceType: 'Oil Change',
    mileageInterval: 5000, // Conventional oil
    timeInterval: 90, // 3 months
    description: 'Engine oil and filter replacement',
    priority: 'high',
    estimatedCost: { labor: 30, parts: 40 },
  },
  {
    serviceType: 'Synthetic Oil Change',
    mileageInterval: 7500,
    timeInterval: 180, // 6 months
    description: 'Synthetic engine oil and filter replacement',
    priority: 'high',
    estimatedCost: { labor: 30, parts: 70 },
  },
  {
    serviceType: 'Tire Rotation',
    mileageInterval: 7500,
    timeInterval: 180,
    description: 'Rotate tires to ensure even wear',
    priority: 'medium',
    estimatedCost: { labor: 25, parts: 0 },
  },
  {
    serviceType: 'Air Filter Replacement',
    mileageInterval: 15000,
    timeInterval: 365,
    description: 'Replace engine air filter',
    priority: 'medium',
    estimatedCost: { labor: 15, parts: 25 },
  },
  {
    serviceType: 'Cabin Air Filter',
    mileageInterval: 15000,
    timeInterval: 365,
    description: 'Replace cabin air filter for HVAC system',
    priority: 'low',
    estimatedCost: { labor: 15, parts: 30 },
  },
  {
    serviceType: 'Brake Inspection',
    mileageInterval: 15000,
    timeInterval: 365,
    description: 'Inspect brake pads, rotors, and fluid',
    priority: 'high',
    estimatedCost: { labor: 40, parts: 0 },
  },
  {
    serviceType: 'Brake Pad Replacement',
    mileageInterval: 40000,
    timeInterval: 730, // 2 years
    description: 'Replace front or rear brake pads',
    priority: 'critical',
    estimatedCost: { labor: 150, parts: 100 },
  },
  {
    serviceType: 'Transmission Fluid',
    mileageInterval: 30000,
    timeInterval: 730, // 2 years
    description: 'Replace transmission fluid',
    priority: 'high',
    estimatedCost: { labor: 100, parts: 80 },
  },
  {
    serviceType: 'Coolant Flush',
    mileageInterval: 30000,
    timeInterval: 730,
    description: 'Flush and replace engine coolant',
    priority: 'medium',
    estimatedCost: { labor: 80, parts: 40 },
  },
  {
    serviceType: 'Spark Plug Replacement',
    mileageInterval: 60000,
    timeInterval: 1460, // 4 years
    description: 'Replace spark plugs',
    priority: 'medium',
    estimatedCost: { labor: 100, parts: 60 },
  },
  {
    serviceType: 'Timing Belt',
    mileageInterval: 100000,
    timeInterval: 2190, // 6 years
    description: 'Replace timing belt (if applicable)',
    priority: 'critical',
    estimatedCost: { labor: 400, parts: 200 },
  },
  {
    serviceType: 'Battery Check',
    mileageInterval: 25000,
    timeInterval: 365,
    description: 'Test battery health and connections',
    priority: 'medium',
    estimatedCost: { labor: 20, parts: 0 },
  },
  {
    serviceType: 'Battery Replacement',
    mileageInterval: 75000,
    timeInterval: 1460, // 4 years
    description: 'Replace vehicle battery',
    priority: 'high',
    estimatedCost: { labor: 30, parts: 150 },
  },
  {
    serviceType: 'Wheel Alignment',
    mileageInterval: 25000,
    timeInterval: 730,
    description: 'Check and adjust wheel alignment',
    priority: 'medium',
    estimatedCost: { labor: 100, parts: 0 },
  },
  {
    serviceType: 'Fuel Filter',
    mileageInterval: 30000,
    timeInterval: 730,
    description: 'Replace fuel filter',
    priority: 'medium',
    estimatedCost: { labor: 50, parts: 30 },
  },
  {
    serviceType: 'Power Steering Fluid',
    mileageInterval: 50000,
    timeInterval: 1095, // 3 years
    description: 'Replace power steering fluid',
    priority: 'low',
    estimatedCost: { labor: 60, parts: 20 },
  },
  {
    serviceType: 'Serpentine Belt',
    mileageInterval: 60000,
    timeInterval: 1460,
    description: 'Replace serpentine/drive belt',
    priority: 'high',
    estimatedCost: { labor: 80, parts: 40 },
  },
];

/**
 * Make-specific interval overrides
 */
const MAKE_SPECIFIC_INTERVALS: Record<string, Partial<Record<string, Partial<ServiceInterval>>>> = {
  Toyota: {
    'Oil Change': { mileageInterval: 5000 },
    'Synthetic Oil Change': { mileageInterval: 10000 },
  },
  Honda: {
    'Oil Change': { mileageInterval: 5000 },
    'Transmission Fluid': { mileageInterval: 25000 },
  },
  BMW: {
    'Synthetic Oil Change': { mileageInterval: 10000 },
    'Brake Pad Replacement': { mileageInterval: 30000, estimatedCost: { labor: 250, parts: 200 } },
  },
  Mercedes: {
    'Synthetic Oil Change': { mileageInterval: 10000 },
    'Brake Inspection': { mileageInterval: 10000 },
  },
  Ford: {
    'Oil Change': { mileageInterval: 7500 },
  },
  Chevrolet: {
    'Oil Change': { mileageInterval: 7500 },
  },
};

/**
 * Get service intervals for a specific vehicle
 */
export function getServiceIntervals(vehicle: VehicleData): ServiceInterval[] {
  const intervals = STANDARD_SERVICE_INTERVALS.map(interval => ({ ...interval }));

  // Apply make-specific overrides
  const makeOverrides = MAKE_SPECIFIC_INTERVALS[vehicle.make];
  if (makeOverrides) {
    intervals.forEach(interval => {
      const override = makeOverrides[interval.serviceType];
      if (override) {
        Object.assign(interval, override);
      }
    });
  }

  // Filter out timing belt for vehicles with timing chains
  // This is a simplified check - in production you'd have a more comprehensive database
  const chainModels = ['Camry', 'Corolla', 'Civic', 'Accord', 'F-150', 'Silverado'];
  if (vehicle.year >= 2010 || chainModels.some(m => vehicle.model.includes(m))) {
    const timingBeltIndex = intervals.findIndex(i => i.serviceType === 'Timing Belt');
    if (timingBeltIndex !== -1) {
      intervals.splice(timingBeltIndex, 1);
    }
  }

  return intervals;
}

/**
 * Calculate service recommendations based on vehicle data and history
 */
export function getServiceRecommendations(
  vehicle: VehicleData,
  serviceHistory: ServiceHistory[],
  currentDate: Date = new Date()
): ServiceRecommendation[] {
  const intervals = getServiceIntervals(vehicle);
  const recommendations: ServiceRecommendation[] = [];

  for (const interval of intervals) {
    // Find the most recent service of this type
    const lastService = serviceHistory
      .filter(s => s.serviceType === interval.serviceType)
      .sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime())[0];

    let dueByDate: Date | undefined;
    let dueByMileage: number | undefined;
    let overdueByDays: number | undefined;
    let overdueByMiles: number | undefined;

    if (lastService) {
      // Calculate due dates based on last service
      dueByDate = new Date(lastService.serviceDate);
      dueByDate.setDate(dueByDate.getDate() + interval.timeInterval);

      dueByMileage = lastService.mileageAtService + interval.mileageInterval;

      // Check if overdue
      const daysSinceService = Math.floor(
        (currentDate.getTime() - lastService.serviceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const milesSinceService = vehicle.mileage - lastService.mileageAtService;

      if (daysSinceService > interval.timeInterval) {
        overdueByDays = daysSinceService - interval.timeInterval;
      }
      if (milesSinceService > interval.mileageInterval) {
        overdueByMiles = milesSinceService - interval.mileageInterval;
      }
    } else {
      // No service history - check based on current mileage
      // Assume service intervals start from 0 mileage
      if (vehicle.mileage > interval.mileageInterval) {
        const missedIntervals = Math.floor(vehicle.mileage / interval.mileageInterval);
        overdueByMiles = vehicle.mileage - (missedIntervals * interval.mileageInterval);
        dueByMileage = (missedIntervals + 1) * interval.mileageInterval;
      } else {
        dueByMileage = interval.mileageInterval;
      }
    }

    const isOverdue = (overdueByDays !== undefined && overdueByDays > 0) ||
                      (overdueByMiles !== undefined && overdueByMiles > 0);

    // Determine priority adjustment based on overdue status
    let adjustedPriority = interval.priority;
    if (isOverdue) {
      if (interval.priority === 'low') adjustedPriority = 'medium';
      else if (interval.priority === 'medium') adjustedPriority = 'high';
      else if (interval.priority === 'high') adjustedPriority = 'critical';
    }

    // Build reason string
    let reason = '';
    if (isOverdue) {
      const parts: string[] = [];
      if (overdueByMiles) {
        parts.push(`${overdueByMiles.toLocaleString()} miles overdue`);
      }
      if (overdueByDays) {
        parts.push(`${overdueByDays} days overdue`);
      }
      reason = `Overdue: ${parts.join(' and ')}`;
    } else if (dueByMileage || dueByDate) {
      const parts: string[] = [];
      if (dueByMileage) {
        const milesUntilDue = dueByMileage - vehicle.mileage;
        if (milesUntilDue <= 1000) {
          parts.push(`due in ${milesUntilDue.toLocaleString()} miles`);
        }
      }
      if (dueByDate) {
        const daysUntilDue = Math.floor(
          (dueByDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 30) {
          parts.push(`due in ${daysUntilDue} days`);
        }
      }
      if (parts.length > 0) {
        reason = `Coming up: ${parts.join(' or ')}`;
      }
    }

    // Only include recommendations that are due soon or overdue
    if (isOverdue || reason) {
      const estimatedCost = interval.estimatedCost
        ? {
            labor: interval.estimatedCost.labor,
            parts: interval.estimatedCost.parts,
            total: interval.estimatedCost.labor + interval.estimatedCost.parts,
          }
        : undefined;

      recommendations.push({
        serviceType: interval.serviceType,
        reason,
        priority: adjustedPriority,
        dueByDate,
        dueByMileage,
        overdue: isOverdue,
        overdueBy: isOverdue
          ? { days: overdueByDays, miles: overdueByMiles }
          : undefined,
        estimatedCost,
      });
    }
  }

  // Sort by priority and overdue status
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => {
    // Overdue items first
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    // Then by priority
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return recommendations;
}

/**
 * Get upcoming service schedule for a vehicle
 */
export function getUpcomingServices(
  vehicle: VehicleData,
  serviceHistory: ServiceHistory[],
  lookaheadMiles: number = 10000,
  lookaheadDays: number = 365
): ServiceRecommendation[] {
  const intervals = getServiceIntervals(vehicle);
  const recommendations: ServiceRecommendation[] = [];
  const currentDate = new Date();
  const maxDate = new Date(currentDate);
  maxDate.setDate(maxDate.getDate() + lookaheadDays);
  const maxMileage = vehicle.mileage + lookaheadMiles;

  for (const interval of intervals) {
    const lastService = serviceHistory
      .filter(s => s.serviceType === interval.serviceType)
      .sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime())[0];

    let nextDueDate: Date;
    let nextDueMileage: number;

    if (lastService) {
      nextDueDate = new Date(lastService.serviceDate);
      nextDueDate.setDate(nextDueDate.getDate() + interval.timeInterval);
      nextDueMileage = lastService.mileageAtService + interval.mileageInterval;
    } else {
      // Estimate based on current mileage
      const missedIntervals = Math.floor(vehicle.mileage / interval.mileageInterval);
      nextDueMileage = (missedIntervals + 1) * interval.mileageInterval;
      // Estimate date based on average driving
      const avgDailyMiles = 35; // Average miles driven per day
      const milesUntilDue = Math.max(0, nextDueMileage - vehicle.mileage);
      nextDueDate = new Date(currentDate);
      nextDueDate.setDate(nextDueDate.getDate() + Math.ceil(milesUntilDue / avgDailyMiles));
    }

    // Include if within lookahead window
    if (nextDueDate <= maxDate || nextDueMileage <= maxMileage) {
      const estimatedCost = interval.estimatedCost
        ? {
            labor: interval.estimatedCost.labor,
            parts: interval.estimatedCost.parts,
            total: interval.estimatedCost.labor + interval.estimatedCost.parts,
          }
        : undefined;

      recommendations.push({
        serviceType: interval.serviceType,
        reason: interval.description,
        priority: interval.priority,
        dueByDate: nextDueDate,
        dueByMileage: nextDueMileage,
        overdue: nextDueDate < currentDate || nextDueMileage < vehicle.mileage,
        estimatedCost,
      });
    }
  }

  // Sort by due date/mileage
  recommendations.sort((a, b) => {
    const aMileage = a.dueByMileage || Infinity;
    const bMileage = b.dueByMileage || Infinity;
    return aMileage - bMileage;
  });

  return recommendations;
}

/**
 * Estimate annual service costs for a vehicle
 */
export function estimateAnnualServiceCosts(
  vehicle: VehicleData,
  annualMileage: number = 12000
): {
  total: number;
  breakdown: Array<{ service: string; occurrences: number; cost: number }>;
} {
  const intervals = getServiceIntervals(vehicle);
  const breakdown: Array<{ service: string; occurrences: number; cost: number }> = [];

  for (const interval of intervals) {
    // Calculate how many times this service would occur in a year
    const byMileage = annualMileage / interval.mileageInterval;
    const byTime = 365 / interval.timeInterval;
    const occurrences = Math.max(byMileage, byTime);

    if (occurrences >= 0.5 && interval.estimatedCost) {
      // Only include if service occurs at least once every 2 years
      const totalCost = interval.estimatedCost.labor + interval.estimatedCost.parts;
      const annualCost = totalCost * Math.ceil(occurrences);

      breakdown.push({
        service: interval.serviceType,
        occurrences: Math.ceil(occurrences),
        cost: annualCost,
      });
    }
  }

  const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

  return {
    total,
    breakdown: breakdown.sort((a, b) => b.cost - a.cost),
  };
}
