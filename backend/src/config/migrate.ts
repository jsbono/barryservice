import { db, runRaw } from './db.js';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mechanic',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  mileage INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_logs (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  notes TEXT,
  service_date TEXT NOT NULL,
  mileage_at_service INTEGER,
  next_service_date TEXT,
  next_service_mileage INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_recommendations (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  recommended_mileage INTEGER,
  recommended_time_months INTEGER
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  service_log_id TEXT NOT NULL REFERENCES service_logs(id) ON DELETE CASCADE,
  email_sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_intervals (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL UNIQUE,
  mileage_increment INTEGER,
  time_months INTEGER
);

CREATE TABLE IF NOT EXISTS scheduled_services (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_vehicle_id ON service_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_next_service_date ON service_logs(next_service_date);
CREATE INDEX IF NOT EXISTS idx_email_logs_service_log_id ON email_logs(service_log_id);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_make_model_year ON service_recommendations(make, model, year);
CREATE INDEX IF NOT EXISTS idx_scheduled_services_vehicle_id ON scheduled_services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- AI Insights Engine tables
CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  action_type TEXT,
  action_url TEXT,
  metadata TEXT,
  read_at TEXT,
  actioned_at TEXT,
  dismissed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  agent_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  insights_created INTEGER DEFAULT 0,
  tokens_used INTEGER,
  cost_cents INTEGER,
  error_message TEXT,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON insights(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_insights_customer_id ON insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_insights_vehicle_id ON insights(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_insights_unread ON insights(read_at);
CREATE INDEX IF NOT EXISTS idx_agent_runs_type ON agent_runs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);

-- MotorAI: Parts Catalog
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  cost REAL NOT NULL DEFAULT 0,
  retail_price REAL NOT NULL DEFAULT 0,
  quantity_in_stock INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 5,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MotorAI: Service Record Parts (junction table)
CREATE TABLE IF NOT EXISTS service_record_parts (
  id TEXT PRIMARY KEY,
  service_log_id TEXT NOT NULL REFERENCES service_logs(id) ON DELETE CASCADE,
  part_id TEXT NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MotorAI: Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_log_id TEXT REFERENCES service_logs(id) ON DELETE SET NULL,
  labor_total REAL NOT NULL DEFAULT 0,
  parts_total REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  pdf_url TEXT,
  due_date TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MotorAI: Voice Transcripts (extend service_logs)
-- Adding voice_transcript and parsed_services columns to service_logs

-- MotorAI: Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'customer',
  type TEXT NOT NULL,
  title TEXT,
  message TEXT NOT NULL,
  metadata TEXT,
  read INTEGER DEFAULT 0,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MotorAI: Labor Rates
CREATE TABLE IF NOT EXISTS labor_rates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate_per_hour REAL NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MotorAI: Tax Rules
CREATE TABLE IF NOT EXISTS tax_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  applies_to_labor INTEGER DEFAULT 1,
  applies_to_parts INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(sku);
CREATE INDEX IF NOT EXISTS idx_parts_active ON parts(is_active);
CREATE INDEX IF NOT EXISTS idx_service_record_parts_service ON service_record_parts(service_log_id);
CREATE INDEX IF NOT EXISTS idx_service_record_parts_part ON service_record_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vehicle ON invoices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(read, created_at);

-- MotorAI: Vehicle Intelligence Engine - Service Schedules
CREATE TABLE IF NOT EXISTS service_schedules (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_category TEXT NOT NULL,
  last_service_date TEXT,
  last_service_mileage INTEGER,
  oil_change_interval_miles INTEGER,
  oil_change_interval_months INTEGER,
  minor_service_interval_miles INTEGER,
  minor_service_interval_months INTEGER,
  major_service_interval_miles INTEGER,
  major_service_interval_months INTEGER,
  next_oil_change_date TEXT,
  next_oil_change_mileage INTEGER,
  next_minor_service_date TEXT,
  next_minor_service_mileage INTEGER,
  next_major_service_date TEXT,
  next_major_service_mileage INTEGER,
  interval_config TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_service_schedules_vehicle ON service_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_schedules_next_oil ON service_schedules(next_oil_change_date);
CREATE INDEX IF NOT EXISTS idx_service_schedules_next_minor ON service_schedules(next_minor_service_date);
CREATE INDEX IF NOT EXISTS idx_service_schedules_next_major ON service_schedules(next_major_service_date);

-- Service Pricing Table for configurable service costs
CREATE TABLE IF NOT EXISTS service_prices (
  id TEXT PRIMARY KEY,
  service_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  base_price REAL NOT NULL DEFAULT 0,
  labor_hours REAL NOT NULL DEFAULT 1,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type);
CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active);
`;

// Additional migrations for existing databases
const alterations = `
-- Add password_hash to customers if it doesn't exist
ALTER TABLE customers ADD COLUMN password_hash TEXT;
ALTER TABLE customers ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));
`;

function migrate() {
  console.log('Running migrations...');
  try {
    runRaw(schema);
    console.log('Schema migrations completed!');

    // Try to run alterations for existing databases (ignore errors for columns that already exist)
    try {
      db.exec('ALTER TABLE customers ADD COLUMN password_hash TEXT');
      console.log('Added password_hash column to customers');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE customers ADD COLUMN updated_at TEXT DEFAULT (datetime(\'now\'))');
      console.log('Added updated_at column to customers');
    } catch {
      // Column likely already exists
    }

    // MotorAI: Add voice_transcript and parsed_services to service_logs
    try {
      db.exec('ALTER TABLE service_logs ADD COLUMN voice_transcript TEXT');
      console.log('Added voice_transcript column to service_logs');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE service_logs ADD COLUMN parsed_services TEXT');
      console.log('Added parsed_services column to service_logs');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE service_logs ADD COLUMN labor_hours REAL');
      console.log('Added labor_hours column to service_logs');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE service_logs ADD COLUMN status TEXT DEFAULT \'completed\'');
      console.log('Added status column to service_logs');
    } catch {
      // Column likely already exists
    }

    // Add mechanic_id to service_logs for tracking who performed the service
    try {
      db.exec('ALTER TABLE service_logs ADD COLUMN mechanic_id TEXT REFERENCES users(id)');
      console.log('Added mechanic_id column to service_logs');
    } catch {
      // Column likely already exists
    }

    // Add engine and last_service_date to vehicles
    try {
      db.exec('ALTER TABLE vehicles ADD COLUMN engine TEXT');
      console.log('Added engine column to vehicles');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE vehicles ADD COLUMN last_service_date TEXT');
      console.log('Added last_service_date column to vehicles');
    } catch {
      // Column likely already exists
    }

    // Insert default labor rate if none exists
    try {
      db.exec(`INSERT INTO labor_rates (id, name, rate_per_hour, is_default)
               SELECT '1', 'Standard Rate', 85.00, 1
               WHERE NOT EXISTS (SELECT 1 FROM labor_rates WHERE is_default = 1)`);
      console.log('Added default labor rate');
    } catch {
      // Already exists
    }

    // Insert default tax rule if none exists
    try {
      db.exec(`INSERT INTO tax_rules (id, name, rate, is_default)
               SELECT '1', 'Standard Tax', 0.0825, 1
               WHERE NOT EXISTS (SELECT 1 FROM tax_rules WHERE is_default = 1)`);
      console.log('Added default tax rule');
    } catch {
      // Already exists
    }

    // Invoice enhancements for invoice generator service
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN invoice_date TEXT');
      console.log('Added invoice_date column to invoices');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN notes TEXT');
      console.log('Added notes column to invoices');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN payment_terms INTEGER DEFAULT 30');
      console.log('Added payment_terms column to invoices');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN sent_at TEXT');
      console.log('Added sent_at column to invoices');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN subtotal REAL DEFAULT 0');
      console.log('Added subtotal column to invoices');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0.0825');
      console.log('Added tax_rate column to invoices');
    } catch {
      // Column likely already exists
    }
    try {
      db.exec('ALTER TABLE invoices ADD COLUMN pdf_data TEXT');
      console.log('Added pdf_data column to invoices');
    } catch {
      // Column likely already exists
    }

    // Create invoice_line_items table for detailed line items
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoice_line_items (
          id TEXT PRIMARY KEY,
          invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          line_type TEXT NOT NULL,
          description TEXT NOT NULL,
          quantity REAL NOT NULL DEFAULT 1,
          unit_price REAL NOT NULL DEFAULT 0,
          total_price REAL NOT NULL DEFAULT 0,
          part_id TEXT REFERENCES parts(id) ON DELETE SET NULL,
          labor_hours REAL
        )
      `);
      console.log('Created invoice_line_items table');
    } catch {
      // Table likely already exists
    }
    try {
      db.exec('CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id)');
      console.log('Created index on invoice_line_items');
    } catch {
      // Index likely already exists
    }

    // Insert default service prices if none exist
    try {
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-oil-change', 'oil_change', 'Oil Change', 49.99, 0.5, 'Full synthetic oil change with filter'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'oil_change')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-tire-rotation', 'tire_rotation', 'Tire Rotation', 29.99, 0.5, 'Rotate all four tires'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'tire_rotation')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-brake-inspection', 'brake_inspection', 'Brake Inspection', 39.99, 0.5, 'Complete brake system inspection'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'brake_inspection')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-brake-service', 'brake_service', 'Brake Service', 199.99, 2.0, 'Brake pad replacement and rotor inspection'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'brake_service')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-minor-service', 'minor_service', 'Minor Service', 149.99, 1.5, 'Oil change, filter, fluid top-off, inspection'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'minor_service')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-major-service', 'major_service', 'Major Service', 349.99, 3.0, 'Comprehensive service including fluids, filters, and inspections'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'major_service')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-transmission', 'transmission_service', 'Transmission Service', 179.99, 1.5, 'Transmission fluid flush and filter'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'transmission_service')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-coolant', 'coolant_flush', 'Coolant Flush', 99.99, 1.0, 'Complete cooling system flush and refill'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'coolant_flush')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-alignment', 'wheel_alignment', 'Wheel Alignment', 89.99, 1.0, 'Four-wheel alignment'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'wheel_alignment')
      `);
      db.exec(`
        INSERT INTO service_prices (id, service_type, display_name, base_price, labor_hours, description)
        SELECT 'sp-diagnostic', 'diagnostic', 'Diagnostic Service', 99.99, 1.0, 'Computer diagnostic and system scan'
        WHERE NOT EXISTS (SELECT 1 FROM service_prices WHERE service_type = 'diagnostic')
      `);
      console.log('Added default service prices');
    } catch (e) {
      // May already exist
    }

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
