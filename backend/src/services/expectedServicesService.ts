import * as VehicleModel from '../models/Vehicle.js';
import * as ServiceLogModel from '../models/ServiceLog.js';
import * as ServiceRecommendationModel from '../models/ServiceRecommendation.js';

export interface ExpectedService {
  vehicle_id: string;
  vehicle_info: string; // "2006 Toyota Tundra"
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
  priority: number; // Lower = more urgent
  last_service_date: string | null;
  last_service_mileage: number | null;
}

export function getExpectedServices(): ExpectedService[] {
  const vehicles = VehicleModel.findAllWithCustomers();
  const allExpectedServices: ExpectedService[] = [];

  for (const vehicle of vehicles) {
    // Get recommended services for this vehicle
    const recommendations = ServiceRecommendationModel.getServices(
      vehicle.make,
      vehicle.model,
      vehicle.year
    );

    // Get service history for this vehicle
    const serviceLogs = ServiceLogModel.findByVehicleId(vehicle.id);

    for (const rec of recommendations) {
      if (!rec.recommended_mileage) continue;

      // Find the most recent service of this type
      const lastService = serviceLogs.find(
        (log) => log.service_type.toLowerCase() === rec.service_name.toLowerCase()
      );

      let nextDueMileage: number;
      let status: 'overdue' | 'due_soon' | 'upcoming';
      let milesUntilDue: number | null = null;

      if (lastService?.mileage_at_service) {
        // Calculate next due based on last service
        nextDueMileage = lastService.mileage_at_service + rec.recommended_mileage;
      } else {
        // No service record - calculate based on current mileage
        if (vehicle.mileage) {
          // Find next interval
          nextDueMileage = Math.ceil(vehicle.mileage / rec.recommended_mileage) * rec.recommended_mileage;
          // If current mileage is at or past the interval, next due is next interval
          if (nextDueMileage <= vehicle.mileage) {
            nextDueMileage += rec.recommended_mileage;
          }
        } else {
          // No mileage recorded, assume first service interval
          nextDueMileage = rec.recommended_mileage;
        }
      }

      // Calculate status based on current mileage
      if (vehicle.mileage) {
        milesUntilDue = nextDueMileage - vehicle.mileage;

        if (milesUntilDue <= 0) {
          status = 'overdue';
        } else if (milesUntilDue <= 1000) {
          status = 'due_soon';
        } else {
          status = 'upcoming';
        }
      } else {
        status = 'upcoming';
      }

      // Calculate priority (lower = more urgent)
      let priority: number;
      if (status === 'overdue') {
        priority = milesUntilDue !== null ? milesUntilDue : 0; // More overdue = lower (more negative)
      } else if (status === 'due_soon') {
        priority = 1000 + (milesUntilDue || 0);
      } else {
        priority = 10000 + (milesUntilDue || 0);
      }

      allExpectedServices.push({
        vehicle_id: vehicle.id,
        vehicle_info: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        customer_name: vehicle.customer_name,
        customer_email: vehicle.customer_email,
        current_mileage: vehicle.mileage || null,
        service_name: rec.service_name,
        category: rec.category || 'minor',
        recommended_mileage: rec.recommended_mileage,
        recommended_months: rec.recommended_time_months || 12,
        next_due_mileage: nextDueMileage,
        miles_until_due: milesUntilDue,
        status,
        priority,
        last_service_date: lastService?.service_date?.toString() || null,
        last_service_mileage: lastService?.mileage_at_service || null,
      });
    }
  }

  // Sort by priority (most urgent first)
  allExpectedServices.sort((a, b) => a.priority - b.priority);

  return allExpectedServices;
}

// Get only services that are due soon or overdue (for email reminders)
export function getServicesDueForReminder(): ExpectedService[] {
  const allServices = getExpectedServices();
  return allServices.filter((s) => s.status === 'overdue' || s.status === 'due_soon');
}

// Get expected services grouped by vehicle
export function getExpectedServicesByVehicle(): Record<string, ExpectedService[]> {
  const services = getExpectedServices();
  const grouped: Record<string, ExpectedService[]> = {};

  for (const service of services) {
    if (!grouped[service.vehicle_id]) {
      grouped[service.vehicle_id] = [];
    }
    grouped[service.vehicle_id].push(service);
  }

  return grouped;
}
