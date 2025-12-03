import { query } from '../config/db.js';
import { ServiceRecommendation } from './types.js';

export function getMakes(): string[] {
  const rows = query<{ make: string }>(
    'SELECT DISTINCT make FROM service_recommendations ORDER BY make'
  );
  return rows.map((r) => r.make);
}

export function getModels(make: string): string[] {
  const rows = query<{ model: string }>(
    'SELECT DISTINCT model FROM service_recommendations WHERE make = ? ORDER BY model',
    [make]
  );
  return rows.map((r) => r.model);
}

export function getYears(make: string, model: string): number[] {
  // Generate years dynamically from 1990 to current year
  // Since maintenance recommendations are calculated dynamically based on vehicle type,
  // we don't need to rely on seeded data for years
  const currentYear = new Date().getFullYear();
  const startYear = 1990;
  const years: number[] = [];

  for (let year = currentYear + 1; year >= startYear; year--) {
    years.push(year);
  }

  return years;
}

export function getServices(make: string, model: string, year: number): ServiceRecommendation[] {
  // Always use the smart vehicle-specific recommendations
  // which are tailored to vehicle type, age, and characteristics
  // This provides consistent major/minor categorization and comprehensive coverage
  return getGenericRecommendations(make, model, year);
}

// Vehicle type detection for maintenance scheduling
function getVehicleType(make: string, model: string): 'truck' | 'suv' | 'luxury' | 'economy' | 'sports' | 'electric' | 'hybrid' | 'standard' {
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  // Electric vehicles
  if (makeLower === 'tesla' || modelLower.includes('electric') || modelLower.includes('ev')) {
    return 'electric';
  }

  // Hybrid detection
  if (modelLower.includes('hybrid') || modelLower.includes('prius') || modelLower.includes('ioniq')) {
    return 'hybrid';
  }

  // Trucks
  const truckModels = ['f-150', 'f150', 'f-250', 'f250', 'f-350', 'silverado', 'sierra', 'ram', '1500', '2500', '3500', 'tundra', 'tacoma', 'titan', 'frontier', 'colorado', 'canyon', 'ranger', 'gladiator', 'ridgeline'];
  if (truckModels.some(t => modelLower.includes(t))) {
    return 'truck';
  }

  // SUVs
  const suvModels = ['suv', 'explorer', 'expedition', 'tahoe', 'suburban', 'yukon', 'pilot', 'passport', 'highlander', '4runner', 'sequoia', 'pathfinder', 'armada', 'durango', 'grand cherokee', 'wrangler', 'bronco', 'defender', 'range rover', 'rav4', 'cr-v', 'crv', 'cx-5', 'cx5', 'tucson', 'santa fe', 'sorento', 'telluride', 'palisade', 'atlas', 'tiguan', 'outback', 'forester', 'crosstrek', 'equinox', 'traverse', 'blazer', 'escape', 'edge', 'rogue', 'murano', 'sportage', 'seltos'];
  if (suvModels.some(s => modelLower.includes(s))) {
    return 'suv';
  }

  // Luxury brands
  const luxuryMakes = ['bmw', 'mercedes', 'mercedes-benz', 'audi', 'lexus', 'infiniti', 'acura', 'porsche', 'jaguar', 'land rover', 'volvo', 'genesis', 'maserati', 'bentley', 'rolls-royce', 'ferrari', 'lamborghini', 'aston martin', 'cadillac', 'lincoln'];
  if (luxuryMakes.some(l => makeLower.includes(l))) {
    return 'luxury';
  }

  // Sports cars
  const sportModels = ['mustang', 'camaro', 'corvette', 'challenger', 'charger', '370z', '350z', 'supra', 'gt-r', 'gtr', 'wrx', 'sti', 'miata', 'mx-5', '86', 'brz'];
  if (sportModels.some(s => modelLower.includes(s))) {
    return 'sports';
  }

  return 'standard';
}

// Get oil change interval based on vehicle age and type
function getOilChangeInterval(year: number, vehicleType: string): { mileage: number; months: number } {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - year;

  // Older vehicles (pre-2010) typically need more frequent oil changes
  if (vehicleAge > 15) {
    return { mileage: 3000, months: 3 };
  }
  if (vehicleAge > 10) {
    return { mileage: 4000, months: 4 };
  }

  // Modern vehicles with synthetic oil
  if (vehicleType === 'luxury' || vehicleType === 'electric') {
    return { mileage: 10000, months: 12 };
  }
  if (vehicleType === 'truck' || vehicleType === 'suv') {
    return { mileage: 5000, months: 6 };
  }

  return { mileage: 5000, months: 6 };
}

// Comprehensive maintenance schedule by vehicle type
function getMaintenanceSchedule(make: string, model: string, year: number, vehicleType: string): ServiceRecommendation[] {
  const oilInterval = getOilChangeInterval(year, vehicleType);
  const services: Array<{ service_name: string; recommended_mileage: number; recommended_time_months: number; category: 'minor' | 'major' }> = [];

  // === MINOR SERVICES (routine maintenance) ===

  // Oil Change - varies by vehicle type and age (not for electric)
  if (vehicleType !== 'electric') {
    services.push({
      service_name: 'Oil Change',
      recommended_mileage: oilInterval.mileage,
      recommended_time_months: oilInterval.months,
      category: 'minor',
    });
  }

  // Tire Rotation
  services.push({
    service_name: 'Tire Rotation',
    recommended_mileage: 7500,
    recommended_time_months: 6,
    category: 'minor',
  });

  // Air Filter (not for electric)
  if (vehicleType !== 'electric') {
    services.push({
      service_name: 'Engine Air Filter',
      recommended_mileage: vehicleType === 'truck' ? 20000 : 30000,
      recommended_time_months: 24,
      category: 'minor',
    });
  }

  // Cabin Air Filter (not on very old vehicles)
  if (year >= 2000) {
    services.push({
      service_name: 'Cabin Air Filter',
      recommended_mileage: 25000,
      recommended_time_months: 24,
      category: 'minor',
    });
  }

  // Wiper Blades
  services.push({
    service_name: 'Wiper Blades',
    recommended_mileage: 20000,
    recommended_time_months: 12,
    category: 'minor',
  });

  // Battery Inspection
  services.push({
    service_name: 'Battery Inspection',
    recommended_mileage: 25000,
    recommended_time_months: 12,
    category: 'minor',
  });

  // Brake Inspection
  services.push({
    service_name: 'Brake Inspection',
    recommended_mileage: 15000,
    recommended_time_months: 12,
    category: 'minor',
  });

  // === MAJOR SERVICES (significant maintenance) ===

  // Brake Pads/Rotors
  services.push({
    service_name: 'Brake Pads Replacement',
    recommended_mileage: vehicleType === 'truck' || vehicleType === 'suv' ? 40000 : 50000,
    recommended_time_months: 48,
    category: 'major',
  });

  // Transmission Fluid
  if (vehicleType !== 'electric') {
    services.push({
      service_name: 'Transmission Fluid Change',
      recommended_mileage: vehicleType === 'luxury' ? 80000 : 60000,
      recommended_time_months: 48,
      category: 'major',
    });
  }

  // Coolant Flush (not electric)
  if (vehicleType !== 'electric') {
    services.push({
      service_name: 'Coolant Flush',
      recommended_mileage: 30000,
      recommended_time_months: 36,
      category: 'major',
    });
  }

  // Spark Plugs (not electric/hybrid)
  if (vehicleType !== 'electric' && vehicleType !== 'hybrid') {
    services.push({
      service_name: 'Spark Plugs',
      recommended_mileage: year >= 2010 ? 100000 : 60000, // Modern iridium vs older plugs
      recommended_time_months: 60,
      category: 'major',
    });
  }

  // Power Steering Fluid (not electric)
  if (vehicleType !== 'electric' && year < 2015) {
    services.push({
      service_name: 'Power Steering Fluid',
      recommended_mileage: 50000,
      recommended_time_months: 48,
      category: 'major',
    });
  }

  // Brake Fluid
  services.push({
    service_name: 'Brake Fluid Flush',
    recommended_mileage: 30000,
    recommended_time_months: 24,
    category: 'major',
  });

  // Serpentine Belt (not electric)
  if (vehicleType !== 'electric') {
    services.push({
      service_name: 'Serpentine Belt',
      recommended_mileage: 60000,
      recommended_time_months: 48,
      category: 'major',
    });
  }

  // Timing Belt (certain vehicles, pre-2010 typically)
  if (vehicleType !== 'electric' && year < 2012) {
    services.push({
      service_name: 'Timing Belt',
      recommended_mileage: 90000,
      recommended_time_months: 72,
      category: 'major',
    });
  }

  // Fuel Filter (older vehicles)
  if (vehicleType !== 'electric' && vehicleType !== 'hybrid' && year < 2010) {
    services.push({
      service_name: 'Fuel Filter',
      recommended_mileage: 30000,
      recommended_time_months: 36,
      category: 'major',
    });
  }

  // === VEHICLE TYPE SPECIFIC ===

  // Trucks/SUVs with 4WD
  if (vehicleType === 'truck' || vehicleType === 'suv') {
    services.push({
      service_name: 'Differential Fluid (Front)',
      recommended_mileage: 30000,
      recommended_time_months: 24,
      category: 'major',
    });
    services.push({
      service_name: 'Differential Fluid (Rear)',
      recommended_mileage: 30000,
      recommended_time_months: 24,
      category: 'major',
    });
    services.push({
      service_name: 'Transfer Case Fluid',
      recommended_mileage: 60000,
      recommended_time_months: 48,
      category: 'major',
    });
  }

  // Electric vehicles
  if (vehicleType === 'electric') {
    services.push({
      service_name: 'Battery Coolant',
      recommended_mileage: 50000,
      recommended_time_months: 48,
      category: 'major',
    });
    services.push({
      service_name: 'Electric Motor Inspection',
      recommended_mileage: 75000,
      recommended_time_months: 60,
      category: 'major',
    });
  }

  // Hybrid specific
  if (vehicleType === 'hybrid') {
    services.push({
      service_name: 'Hybrid Battery Inspection',
      recommended_mileage: 50000,
      recommended_time_months: 48,
      category: 'major',
    });
  }

  // Alignment check for all
  services.push({
    service_name: 'Wheel Alignment Check',
    recommended_mileage: 25000,
    recommended_time_months: 24,
    category: 'minor',
  });

  return services.map((svc, index) => ({
    id: `${vehicleType}-${index}`,
    make,
    model,
    year,
    service_name: svc.service_name,
    recommended_mileage: svc.recommended_mileage,
    recommended_time_months: svc.recommended_time_months,
    category: svc.category,
  }));
}

// Main function to get recommendations with fallback to smart generic
function getGenericRecommendations(make: string, model: string, year: number): ServiceRecommendation[] {
  const vehicleType = getVehicleType(make, model);
  return getMaintenanceSchedule(make, model, year, vehicleType);
}
