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

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
