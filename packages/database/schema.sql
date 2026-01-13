-- MotorAI Database Schema
-- PostgreSQL/Supabase compatible schema with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    login_email VARCHAR(255) UNIQUE,
    passwordless_auth_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for customers
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_login_email ON customers(login_email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vin VARCHAR(17) UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100),
    engine VARCHAR(100),
    mileage INTEGER CHECK (mileage >= 0),
    last_service_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vehicles
CREATE INDEX idx_vehicles_customer_id ON vehicles(customer_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_last_service_date ON vehicles(last_service_date);

-- ============================================
-- MECHANICS TABLE
-- ============================================
CREATE TABLE mechanics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    hourly_rate DECIMAL(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for mechanics
CREATE INDEX idx_mechanics_email ON mechanics(email);
CREATE INDEX idx_mechanics_is_active ON mechanics(is_active);

-- ============================================
-- SERVICE RECORDS TABLE
-- ============================================
CREATE TABLE service_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    mechanic_id UUID REFERENCES mechanics(id) ON DELETE SET NULL,
    service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voice_transcript TEXT,
    parsed_services JSONB DEFAULT '[]'::JSONB,
    labor_hours DECIMAL(5, 2) CHECK (labor_hours >= 0),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for service_records
CREATE INDEX idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX idx_service_records_mechanic_id ON service_records(mechanic_id);
CREATE INDEX idx_service_records_service_date ON service_records(service_date);
CREATE INDEX idx_service_records_status ON service_records(status);
CREATE INDEX idx_service_records_parsed_services ON service_records USING GIN (parsed_services);

-- ============================================
-- PARTS TABLE
-- ============================================
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
    retail_price DECIMAL(10, 2) NOT NULL CHECK (retail_price >= 0),
    quantity_in_stock INTEGER DEFAULT 0 CHECK (quantity_in_stock >= 0),
    reorder_threshold INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for parts
CREATE INDEX idx_parts_sku ON parts(sku);
CREATE INDEX idx_parts_name ON parts(name);
CREATE INDEX idx_parts_is_active ON parts(is_active);

-- ============================================
-- SERVICE RECORD PARTS (Junction Table)
-- ============================================
CREATE TABLE service_record_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_record_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(service_record_id, part_id)
);

-- Indexes for service_record_parts
CREATE INDEX idx_service_record_parts_service_record_id ON service_record_parts(service_record_id);
CREATE INDEX idx_service_record_parts_part_id ON service_record_parts(part_id);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    service_record_id UUID REFERENCES service_records(id) ON DELETE SET NULL,
    labor_total DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (labor_total >= 0),
    parts_total DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (parts_total >= 0),
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
    total DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
    pdf_url TEXT,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for invoices
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_vehicle_id ON invoices(vehicle_id);
CREATE INDEX idx_invoices_service_record_id ON invoices(service_record_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- SERVICE SCHEDULES TABLE
-- ============================================
CREATE TABLE service_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID UNIQUE NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    oil_change_interval INTEGER DEFAULT 5000 CHECK (oil_change_interval > 0), -- miles
    major_service_interval INTEGER DEFAULT 30000 CHECK (major_service_interval > 0), -- miles
    minor_service_interval INTEGER DEFAULT 15000 CHECK (minor_service_interval > 0), -- miles
    last_oil_change DATE,
    last_oil_change_mileage INTEGER,
    last_major DATE,
    last_major_mileage INTEGER,
    last_minor DATE,
    last_minor_mileage INTEGER,
    next_oil_change_due DATE,
    next_major_due DATE,
    next_minor_due DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for service_schedules
CREATE INDEX idx_service_schedules_vehicle_id ON service_schedules(vehicle_id);
CREATE INDEX idx_service_schedules_next_oil_change_due ON service_schedules(next_oil_change_due);
CREATE INDEX idx_service_schedules_next_major_due ON service_schedules(next_major_due);
CREATE INDEX idx_service_schedules_next_minor_due ON service_schedules(next_minor_due);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('customer', 'mechanic', 'admin')),
    type VARCHAR(100) NOT NULL CHECK (type IN ('service_reminder', 'invoice_ready', 'payment_received', 'service_complete', 'appointment_reminder', 'system')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_type ON notifications(user_type);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, user_type) WHERE read = FALSE;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix VARCHAR(4);
    next_number INTEGER;
BEGIN
    year_prefix := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE year_prefix || '-%';

    NEW.invoice_number := year_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mechanics_updated_at
    BEFORE UPDATE ON mechanics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_records_updated_at
    BEFORE UPDATE ON service_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_schedules_updated_at
    BEFORE UPDATE ON service_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Invoice number generation trigger
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL)
    EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_record_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICY PLACEHOLDERS
-- Uncomment and customize based on your auth setup
-- ============================================

-- Customers policies
-- CREATE POLICY "Customers can view own profile"
--     ON customers FOR SELECT
--     USING (auth.uid()::text = login_email);

-- CREATE POLICY "Admins can view all customers"
--     ON customers FOR SELECT
--     USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admins can manage customers"
--     ON customers FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Vehicles policies
-- CREATE POLICY "Customers can view own vehicles"
--     ON vehicles FOR SELECT
--     USING (customer_id IN (SELECT id FROM customers WHERE login_email = auth.uid()::text));

-- CREATE POLICY "Mechanics can view all vehicles"
--     ON vehicles FOR SELECT
--     USING (auth.jwt() ->> 'role' IN ('mechanic', 'admin'));

-- Service records policies
-- CREATE POLICY "Customers can view own service records"
--     ON service_records FOR SELECT
--     USING (vehicle_id IN (
--         SELECT v.id FROM vehicles v
--         JOIN customers c ON v.customer_id = c.id
--         WHERE c.login_email = auth.uid()::text
--     ));

-- CREATE POLICY "Mechanics can manage service records"
--     ON service_records FOR ALL
--     USING (auth.jwt() ->> 'role' IN ('mechanic', 'admin'));

-- Invoices policies
-- CREATE POLICY "Customers can view own invoices"
--     ON invoices FOR SELECT
--     USING (customer_id IN (SELECT id FROM customers WHERE login_email = auth.uid()::text));

-- CREATE POLICY "Admins can manage invoices"
--     ON invoices FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Notifications policies
-- CREATE POLICY "Users can view own notifications"
--     ON notifications FOR SELECT
--     USING (user_id::text = auth.uid()::text);

-- CREATE POLICY "Users can update own notifications"
--     ON notifications FOR UPDATE
--     USING (user_id::text = auth.uid()::text);

-- ============================================
-- VIEWS
-- ============================================

-- View for vehicle service history with customer info
CREATE OR REPLACE VIEW vehicle_service_history AS
SELECT
    sr.id AS service_record_id,
    sr.service_date,
    sr.labor_hours,
    sr.notes,
    sr.status,
    sr.parsed_services,
    v.id AS vehicle_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    v.mileage,
    c.id AS customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    m.id AS mechanic_id,
    m.name AS mechanic_name
FROM service_records sr
JOIN vehicles v ON sr.vehicle_id = v.id
JOIN customers c ON v.customer_id = c.id
LEFT JOIN mechanics m ON sr.mechanic_id = m.id;

-- View for upcoming service due
CREATE OR REPLACE VIEW upcoming_service_due AS
SELECT
    v.id AS vehicle_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    v.mileage,
    c.id AS customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    ss.next_oil_change_due,
    ss.next_major_due,
    ss.next_minor_due,
    LEAST(ss.next_oil_change_due, ss.next_major_due, ss.next_minor_due) AS next_service_due
FROM vehicles v
JOIN customers c ON v.customer_id = c.id
LEFT JOIN service_schedules ss ON v.id = ss.vehicle_id
WHERE ss.next_oil_change_due IS NOT NULL
   OR ss.next_major_due IS NOT NULL
   OR ss.next_minor_due IS NOT NULL;

-- View for invoice summary
CREATE OR REPLACE VIEW invoice_summary AS
SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.labor_total,
    i.parts_total,
    i.tax,
    i.discount,
    i.total,
    i.status,
    i.due_date,
    i.created_at,
    c.id AS customer_id,
    c.name AS customer_name,
    c.email AS customer_email,
    v.id AS vehicle_id,
    v.make,
    v.model,
    v.year,
    v.vin
FROM invoices i
JOIN customers c ON i.customer_id = c.id
JOIN vehicles v ON i.vehicle_id = v.id;

-- ============================================
-- SAMPLE DATA (Optional - Comment out in production)
-- ============================================

-- Uncomment below to insert sample data for testing

-- INSERT INTO customers (name, email, phone, login_email) VALUES
--     ('John Smith', 'john.smith@email.com', '555-0101', 'john.smith@email.com'),
--     ('Jane Doe', 'jane.doe@email.com', '555-0102', 'jane.doe@email.com'),
--     ('Bob Wilson', 'bob.wilson@email.com', '555-0103', 'bob.wilson@email.com');

-- INSERT INTO mechanics (name, email, phone, hourly_rate) VALUES
--     ('Mike Johnson', 'mike.j@motorai.com', '555-0201', 75.00),
--     ('Sarah Williams', 'sarah.w@motorai.com', '555-0202', 85.00),
--     ('Tom Brown', 'tom.b@motorai.com', '555-0203', 70.00);

-- INSERT INTO parts (name, sku, cost, retail_price) VALUES
--     ('Oil Filter - Standard', 'OF-STD-001', 5.00, 12.99),
--     ('Air Filter - Universal', 'AF-UNI-001', 8.00, 24.99),
--     ('Brake Pads - Front Set', 'BP-FRT-001', 25.00, 79.99),
--     ('Synthetic Oil 5W-30 (5qt)', 'OIL-SYN-530', 22.00, 49.99),
--     ('Spark Plugs - Set of 4', 'SP-SET-004', 12.00, 39.99);
