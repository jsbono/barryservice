import { queryOne } from '../config/db.js';
import { ServiceInterval } from '../models/types.js';

interface IntervalConfig {
  mileage_increment?: number;
  time_months?: number;
}

export function getIntervalForServiceType(serviceType: string): IntervalConfig {
  const interval = queryOne<ServiceInterval>(
    'SELECT * FROM service_intervals WHERE service_type = ?',
    [serviceType]
  );

  if (!interval) {
    return {};
  }

  return {
    mileage_increment: interval.mileage_increment || undefined,
    time_months: interval.time_months || undefined,
  };
}

export function computeNextService(
  serviceType: string,
  serviceDate: Date,
  mileageAtService?: number
): { nextServiceDate?: Date; nextServiceMileage?: number } {
  const cfg = getIntervalForServiceType(serviceType);

  let nextServiceDate: Date | undefined;
  let nextServiceMileage: number | undefined;

  if (cfg.time_months) {
    nextServiceDate = new Date(serviceDate);
    nextServiceDate.setMonth(nextServiceDate.getMonth() + cfg.time_months);
  }

  if (cfg.mileage_increment && typeof mileageAtService === 'number') {
    nextServiceMileage = mileageAtService + cfg.mileage_increment;
  }

  return { nextServiceDate, nextServiceMileage };
}
