import { db } from './db.js';
import { hashPassword } from '../utils/password.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding database...');

  try {
    // Insert default service intervals
    const intervals = [
      { service_type: 'oil_change', mileage_increment: 5000, time_months: 6 },
      { service_type: 'minor_service', mileage_increment: 12000, time_months: 12 },
      { service_type: 'major_service', mileage_increment: 30000, time_months: 24 },
    ];

    const insertInterval = db.prepare(
      'INSERT OR IGNORE INTO service_intervals (id, service_type, mileage_increment, time_months) VALUES (?, ?, ?, ?)'
    );

    for (const interval of intervals) {
      insertInterval.run(uuidv4(), interval.service_type, interval.mileage_increment, interval.time_months);
    }
    console.log('Service intervals seeded.');

    // Create a test mechanic user
    const hashedPassword = await hashPassword('password123');
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('mechanic@example.com');
    if (!existingUser) {
      db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
        uuidv4(),
        'mechanic@example.com',
        hashedPassword,
        'mechanic'
      );
      console.log('Test user created: mechanic@example.com / password123');
    } else {
      console.log('Test user already exists.');
    }

    // Seed comprehensive service recommendations
    const recommendations = [
      // Toyota Camry
      { make: 'Toyota', model: 'Camry', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Toyota', model: 'Camry', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Toyota', model: 'Camry', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Toyota', model: 'Camry', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2021, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2021, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Toyota', model: 'Camry', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2022, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2023, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Camry', year: 2024, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Toyota Corolla
      { make: 'Toyota', model: 'Corolla', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Corolla', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Corolla', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Toyota', model: 'Corolla', year: 2020, service_name: 'Coolant Flush', mileage: 30000, months: 36 },
      { make: 'Toyota', model: 'Corolla', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Corolla', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Corolla', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Toyota RAV4
      { make: 'Toyota', model: 'RAV4', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'RAV4', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'RAV4', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Toyota', model: 'RAV4', year: 2020, service_name: 'AWD Fluid', mileage: 30000, months: 24 },
      { make: 'Toyota', model: 'RAV4', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'RAV4', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'RAV4', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Toyota Highlander
      { make: 'Toyota', model: 'Highlander', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Highlander', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Highlander', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Toyota', model: 'Highlander', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Highlander', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Toyota Tacoma
      { make: 'Toyota', model: 'Tacoma', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Tacoma', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Tacoma', year: 2020, service_name: 'Differential Fluid', mileage: 30000, months: 24 },
      { make: 'Toyota', model: 'Tacoma', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Tacoma', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Toyota Tundra (including older years)
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Spark Plugs', mileage: 60000, months: 48 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Coolant Flush', mileage: 30000, months: 36 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Differential Fluid', mileage: 30000, months: 24 },
      { make: 'Toyota', model: 'Tundra', year: 2006, service_name: 'Timing Belt', mileage: 90000, months: 72 },
      { make: 'Toyota', model: 'Tundra', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Tundra', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Toyota', model: 'Tundra', year: 2020, service_name: 'Differential Fluid', mileage: 30000, months: 24 },
      { make: 'Toyota', model: 'Tundra', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Toyota', model: 'Tundra', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Honda Civic
      { make: 'Honda', model: 'Civic', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Civic', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Honda', model: 'Civic', year: 2020, service_name: 'Air Filter', mileage: 15000, months: 12 },
      { make: 'Honda', model: 'Civic', year: 2020, service_name: 'Spark Plugs', mileage: 30000, months: 24 },
      { make: 'Honda', model: 'Civic', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Honda', model: 'Civic', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Civic', year: 2021, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Honda', model: 'Civic', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Civic', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Honda Accord
      { make: 'Honda', model: 'Accord', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Accord', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Honda', model: 'Accord', year: 2020, service_name: 'Brake Fluid', mileage: 30000, months: 36 },
      { make: 'Honda', model: 'Accord', year: 2020, service_name: 'Coolant Flush', mileage: 60000, months: 60 },
      { make: 'Honda', model: 'Accord', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Accord', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Accord', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Honda CR-V
      { make: 'Honda', model: 'CR-V', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'CR-V', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Honda', model: 'CR-V', year: 2020, service_name: 'AWD Fluid', mileage: 30000, months: 24 },
      { make: 'Honda', model: 'CR-V', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Honda', model: 'CR-V', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'CR-V', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'CR-V', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Honda Pilot
      { make: 'Honda', model: 'Pilot', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Pilot', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Honda', model: 'Pilot', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Honda', model: 'Pilot', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Honda', model: 'Pilot', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Ford F-150
      { make: 'Ford', model: 'F-150', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'F-150', year: 2020, service_name: 'Tire Rotation', mileage: 10000, months: 12 },
      { make: 'Ford', model: 'F-150', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Ford', model: 'F-150', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Ford', model: 'F-150', year: 2020, service_name: 'Spark Plugs', mileage: 60000, months: 48 },
      { make: 'Ford', model: 'F-150', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'F-150', year: 2021, service_name: 'Tire Rotation', mileage: 10000, months: 12 },
      { make: 'Ford', model: 'F-150', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'F-150', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Ford Mustang
      { make: 'Ford', model: 'Mustang', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Mustang', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Ford', model: 'Mustang', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Ford', model: 'Mustang', year: 2020, service_name: 'Coolant Flush', mileage: 100000, months: 60 },
      { make: 'Ford', model: 'Mustang', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Mustang', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Mustang', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Ford Explorer
      { make: 'Ford', model: 'Explorer', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Explorer', year: 2020, service_name: 'Tire Rotation', mileage: 10000, months: 12 },
      { make: 'Ford', model: 'Explorer', year: 2020, service_name: 'AWD Fluid', mileage: 60000, months: 48 },
      { make: 'Ford', model: 'Explorer', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Explorer', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Ford Escape
      { make: 'Ford', model: 'Escape', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Escape', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Ford', model: 'Escape', year: 2020, service_name: 'Cabin Air Filter', mileage: 20000, months: 24 },
      { make: 'Ford', model: 'Escape', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Ford', model: 'Escape', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Chevrolet Silverado
      { make: 'Chevrolet', model: 'Silverado', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Silverado', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Chevrolet', model: 'Silverado', year: 2020, service_name: 'Fuel Filter', mileage: 30000, months: 24 },
      { make: 'Chevrolet', model: 'Silverado', year: 2020, service_name: 'Transmission Fluid', mileage: 45000, months: 36 },
      { make: 'Chevrolet', model: 'Silverado', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Silverado', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Silverado', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Chevrolet Equinox
      { make: 'Chevrolet', model: 'Equinox', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Equinox', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Chevrolet', model: 'Equinox', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Chevrolet', model: 'Equinox', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Equinox', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Chevrolet Malibu
      { make: 'Chevrolet', model: 'Malibu', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Malibu', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Chevrolet', model: 'Malibu', year: 2020, service_name: 'Air Filter', mileage: 45000, months: 36 },
      { make: 'Chevrolet', model: 'Malibu', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Malibu', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Chevrolet Tahoe
      { make: 'Chevrolet', model: 'Tahoe', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Tahoe', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Chevrolet', model: 'Tahoe', year: 2020, service_name: 'Transmission Fluid', mileage: 45000, months: 36 },
      { make: 'Chevrolet', model: 'Tahoe', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Chevrolet', model: 'Tahoe', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Nissan Altima
      { make: 'Nissan', model: 'Altima', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Altima', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Nissan', model: 'Altima', year: 2020, service_name: 'CVT Fluid', mileage: 60000, months: 48 },
      { make: 'Nissan', model: 'Altima', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Nissan', model: 'Altima', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Altima', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Altima', year: 2023, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Nissan Rogue
      { make: 'Nissan', model: 'Rogue', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Rogue', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Nissan', model: 'Rogue', year: 2020, service_name: 'CVT Fluid', mileage: 60000, months: 48 },
      { make: 'Nissan', model: 'Rogue', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Nissan', model: 'Rogue', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Rogue', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Nissan Sentra
      { make: 'Nissan', model: 'Sentra', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Sentra', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Nissan', model: 'Sentra', year: 2020, service_name: 'CVT Fluid', mileage: 60000, months: 48 },
      { make: 'Nissan', model: 'Sentra', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Nissan', model: 'Sentra', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Hyundai Sonata
      { make: 'Hyundai', model: 'Sonata', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Sonata', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Hyundai', model: 'Sonata', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Hyundai', model: 'Sonata', year: 2020, service_name: 'Coolant Flush', mileage: 60000, months: 48 },
      { make: 'Hyundai', model: 'Sonata', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Sonata', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Sonata', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Hyundai Elantra
      { make: 'Hyundai', model: 'Elantra', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Elantra', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Hyundai', model: 'Elantra', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Hyundai', model: 'Elantra', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Elantra', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Hyundai Tucson
      { make: 'Hyundai', model: 'Tucson', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Tucson', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Hyundai', model: 'Tucson', year: 2020, service_name: 'AWD Fluid', mileage: 60000, months: 48 },
      { make: 'Hyundai', model: 'Tucson', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Tucson', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Hyundai Santa Fe
      { make: 'Hyundai', model: 'Santa Fe', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Santa Fe', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Hyundai', model: 'Santa Fe', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Hyundai', model: 'Santa Fe', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Hyundai', model: 'Santa Fe', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Kia Optima/K5
      { make: 'Kia', model: 'K5', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'K5', year: 2021, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Kia', model: 'K5', year: 2021, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Kia', model: 'K5', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'K5', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Kia Sportage
      { make: 'Kia', model: 'Sportage', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'Sportage', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Kia', model: 'Sportage', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Kia', model: 'Sportage', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'Sportage', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'Sportage', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Kia Telluride
      { make: 'Kia', model: 'Telluride', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'Telluride', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Kia', model: 'Telluride', year: 2020, service_name: 'AWD Fluid', mileage: 60000, months: 48 },
      { make: 'Kia', model: 'Telluride', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'Telluride', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Kia', model: 'Telluride', year: 2023, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // BMW 3 Series
      { make: 'BMW', model: '3 Series', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'BMW', model: '3 Series', year: 2020, service_name: 'Brake Fluid', mileage: 30000, months: 24 },
      { make: 'BMW', model: '3 Series', year: 2020, service_name: 'Air Filter', mileage: 40000, months: 36 },
      { make: 'BMW', model: '3 Series', year: 2020, service_name: 'Spark Plugs', mileage: 60000, months: 48 },
      { make: 'BMW', model: '3 Series', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'BMW', model: '3 Series', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // BMW X3
      { make: 'BMW', model: 'X3', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'BMW', model: 'X3', year: 2020, service_name: 'Brake Fluid', mileage: 30000, months: 24 },
      { make: 'BMW', model: 'X3', year: 2020, service_name: 'xDrive Fluid', mileage: 60000, months: 48 },
      { make: 'BMW', model: 'X3', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'BMW', model: 'X3', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // BMW X5
      { make: 'BMW', model: 'X5', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'BMW', model: 'X5', year: 2020, service_name: 'Brake Fluid', mileage: 30000, months: 24 },
      { make: 'BMW', model: 'X5', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'BMW', model: 'X5', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'BMW', model: 'X5', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Mercedes-Benz C-Class
      { make: 'Mercedes-Benz', model: 'C-Class', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Mercedes-Benz', model: 'C-Class', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Mercedes-Benz', model: 'C-Class', year: 2020, service_name: 'Air Filter', mileage: 40000, months: 36 },
      { make: 'Mercedes-Benz', model: 'C-Class', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Mercedes-Benz', model: 'C-Class', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Mercedes-Benz E-Class
      { make: 'Mercedes-Benz', model: 'E-Class', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Mercedes-Benz', model: 'E-Class', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Mercedes-Benz', model: 'E-Class', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Mercedes-Benz', model: 'E-Class', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Mercedes-Benz', model: 'E-Class', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Mercedes-Benz GLE
      { make: 'Mercedes-Benz', model: 'GLE', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Mercedes-Benz', model: 'GLE', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Mercedes-Benz', model: 'GLE', year: 2020, service_name: '4MATIC Fluid', mileage: 60000, months: 48 },
      { make: 'Mercedes-Benz', model: 'GLE', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Mercedes-Benz', model: 'GLE', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Audi A4
      { make: 'Audi', model: 'A4', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Audi', model: 'A4', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Audi', model: 'A4', year: 2020, service_name: 'Spark Plugs', mileage: 60000, months: 48 },
      { make: 'Audi', model: 'A4', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Audi', model: 'A4', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Audi Q5
      { make: 'Audi', model: 'Q5', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Audi', model: 'Q5', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Audi', model: 'Q5', year: 2020, service_name: 'Quattro Fluid', mileage: 40000, months: 36 },
      { make: 'Audi', model: 'Q5', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Audi', model: 'Q5', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Subaru Outback
      { make: 'Subaru', model: 'Outback', year: 2020, service_name: 'Oil Change', mileage: 6000, months: 6 },
      { make: 'Subaru', model: 'Outback', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Subaru', model: 'Outback', year: 2020, service_name: 'CVT Fluid', mileage: 60000, months: 48 },
      { make: 'Subaru', model: 'Outback', year: 2020, service_name: 'Brake Fluid', mileage: 30000, months: 24 },
      { make: 'Subaru', model: 'Outback', year: 2021, service_name: 'Oil Change', mileage: 6000, months: 6 },
      { make: 'Subaru', model: 'Outback', year: 2022, service_name: 'Oil Change', mileage: 6000, months: 6 },

      // Subaru Forester
      { make: 'Subaru', model: 'Forester', year: 2020, service_name: 'Oil Change', mileage: 6000, months: 6 },
      { make: 'Subaru', model: 'Forester', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Subaru', model: 'Forester', year: 2020, service_name: 'CVT Fluid', mileage: 60000, months: 48 },
      { make: 'Subaru', model: 'Forester', year: 2021, service_name: 'Oil Change', mileage: 6000, months: 6 },
      { make: 'Subaru', model: 'Forester', year: 2022, service_name: 'Oil Change', mileage: 6000, months: 6 },

      // Subaru Crosstrek
      { make: 'Subaru', model: 'Crosstrek', year: 2020, service_name: 'Oil Change', mileage: 6000, months: 6 },
      { make: 'Subaru', model: 'Crosstrek', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Subaru', model: 'Crosstrek', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Subaru', model: 'Crosstrek', year: 2021, service_name: 'Oil Change', mileage: 6000, months: 6 },
      { make: 'Subaru', model: 'Crosstrek', year: 2022, service_name: 'Oil Change', mileage: 6000, months: 6 },

      // Mazda CX-5
      { make: 'Mazda', model: 'CX-5', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Mazda', model: 'CX-5', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Mazda', model: 'CX-5', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Mazda', model: 'CX-5', year: 2020, service_name: 'Coolant Flush', mileage: 60000, months: 48 },
      { make: 'Mazda', model: 'CX-5', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Mazda', model: 'CX-5', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Mazda3
      { make: 'Mazda', model: 'Mazda3', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Mazda', model: 'Mazda3', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Mazda', model: 'Mazda3', year: 2020, service_name: 'Air Filter', mileage: 30000, months: 24 },
      { make: 'Mazda', model: 'Mazda3', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Mazda', model: 'Mazda3', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Volkswagen Jetta
      { make: 'Volkswagen', model: 'Jetta', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Volkswagen', model: 'Jetta', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Volkswagen', model: 'Jetta', year: 2020, service_name: 'Air Filter', mileage: 40000, months: 36 },
      { make: 'Volkswagen', model: 'Jetta', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Volkswagen', model: 'Jetta', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Volkswagen Tiguan
      { make: 'Volkswagen', model: 'Tiguan', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Volkswagen', model: 'Tiguan', year: 2020, service_name: 'Brake Fluid', mileage: 20000, months: 24 },
      { make: 'Volkswagen', model: 'Tiguan', year: 2020, service_name: '4MOTION Fluid', mileage: 40000, months: 36 },
      { make: 'Volkswagen', model: 'Tiguan', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Volkswagen', model: 'Tiguan', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Jeep Wrangler
      { make: 'Jeep', model: 'Wrangler', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Jeep', model: 'Wrangler', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Jeep', model: 'Wrangler', year: 2020, service_name: 'Differential Fluid', mileage: 30000, months: 24 },
      { make: 'Jeep', model: 'Wrangler', year: 2020, service_name: 'Transfer Case Fluid', mileage: 60000, months: 48 },
      { make: 'Jeep', model: 'Wrangler', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Jeep', model: 'Wrangler', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // Jeep Grand Cherokee
      { make: 'Jeep', model: 'Grand Cherokee', year: 2020, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Jeep', model: 'Grand Cherokee', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Jeep', model: 'Grand Cherokee', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'Jeep', model: 'Grand Cherokee', year: 2021, service_name: 'Oil Change', mileage: 5000, months: 6 },
      { make: 'Jeep', model: 'Grand Cherokee', year: 2022, service_name: 'Oil Change', mileage: 5000, months: 6 },

      // RAM 1500
      { make: 'RAM', model: '1500', year: 2020, service_name: 'Oil Change', mileage: 8000, months: 12 },
      { make: 'RAM', model: '1500', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'RAM', model: '1500', year: 2020, service_name: 'Transmission Fluid', mileage: 60000, months: 48 },
      { make: 'RAM', model: '1500', year: 2020, service_name: 'Differential Fluid', mileage: 30000, months: 24 },
      { make: 'RAM', model: '1500', year: 2021, service_name: 'Oil Change', mileage: 8000, months: 12 },
      { make: 'RAM', model: '1500', year: 2022, service_name: 'Oil Change', mileage: 8000, months: 12 },

      // GMC Sierra
      { make: 'GMC', model: 'Sierra', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'GMC', model: 'Sierra', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'GMC', model: 'Sierra', year: 2020, service_name: 'Fuel Filter', mileage: 30000, months: 24 },
      { make: 'GMC', model: 'Sierra', year: 2020, service_name: 'Transmission Fluid', mileage: 45000, months: 36 },
      { make: 'GMC', model: 'Sierra', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'GMC', model: 'Sierra', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Lexus RX
      { make: 'Lexus', model: 'RX', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Lexus', model: 'RX', year: 2020, service_name: 'Tire Rotation', mileage: 5000, months: 6 },
      { make: 'Lexus', model: 'RX', year: 2020, service_name: 'Brake Inspection', mileage: 15000, months: 12 },
      { make: 'Lexus', model: 'RX', year: 2020, service_name: 'Coolant Flush', mileage: 100000, months: 60 },
      { make: 'Lexus', model: 'RX', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Lexus', model: 'RX', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Lexus ES
      { make: 'Lexus', model: 'ES', year: 2020, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Lexus', model: 'ES', year: 2020, service_name: 'Tire Rotation', mileage: 5000, months: 6 },
      { make: 'Lexus', model: 'ES', year: 2020, service_name: 'Brake Fluid', mileage: 30000, months: 24 },
      { make: 'Lexus', model: 'ES', year: 2021, service_name: 'Oil Change', mileage: 10000, months: 12 },
      { make: 'Lexus', model: 'ES', year: 2022, service_name: 'Oil Change', mileage: 10000, months: 12 },

      // Acura MDX
      { make: 'Acura', model: 'MDX', year: 2020, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Acura', model: 'MDX', year: 2020, service_name: 'Tire Rotation', mileage: 7500, months: 6 },
      { make: 'Acura', model: 'MDX', year: 2020, service_name: 'SH-AWD Fluid', mileage: 30000, months: 24 },
      { make: 'Acura', model: 'MDX', year: 2021, service_name: 'Oil Change', mileage: 7500, months: 12 },
      { make: 'Acura', model: 'MDX', year: 2022, service_name: 'Oil Change', mileage: 7500, months: 12 },

      // Tesla Model 3 (electric - different maintenance)
      { make: 'Tesla', model: 'Model 3', year: 2020, service_name: 'Tire Rotation', mileage: 6250, months: 6 },
      { make: 'Tesla', model: 'Model 3', year: 2020, service_name: 'Cabin Air Filter', mileage: 24000, months: 24 },
      { make: 'Tesla', model: 'Model 3', year: 2020, service_name: 'Brake Fluid', mileage: 50000, months: 24 },
      { make: 'Tesla', model: 'Model 3', year: 2020, service_name: 'A/C Desiccant', mileage: 72000, months: 72 },
      { make: 'Tesla', model: 'Model 3', year: 2021, service_name: 'Tire Rotation', mileage: 6250, months: 6 },
      { make: 'Tesla', model: 'Model 3', year: 2022, service_name: 'Tire Rotation', mileage: 6250, months: 6 },

      // Tesla Model Y
      { make: 'Tesla', model: 'Model Y', year: 2020, service_name: 'Tire Rotation', mileage: 6250, months: 6 },
      { make: 'Tesla', model: 'Model Y', year: 2020, service_name: 'Cabin Air Filter', mileage: 24000, months: 24 },
      { make: 'Tesla', model: 'Model Y', year: 2020, service_name: 'Brake Fluid', mileage: 50000, months: 24 },
      { make: 'Tesla', model: 'Model Y', year: 2021, service_name: 'Tire Rotation', mileage: 6250, months: 6 },
      { make: 'Tesla', model: 'Model Y', year: 2022, service_name: 'Tire Rotation', mileage: 6250, months: 6 },
    ];

    const insertRec = db.prepare(
      'INSERT INTO service_recommendations (id, make, model, year, service_name, recommended_mileage, recommended_time_months) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    // Clear existing recommendations first
    db.prepare('DELETE FROM service_recommendations').run();

    for (const rec of recommendations) {
      insertRec.run(uuidv4(), rec.make, rec.model, rec.year, rec.service_name, rec.mileage, rec.months);
    }
    console.log('Service recommendations seeded.');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
