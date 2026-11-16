-- =====================================================================
-- Matgarak Platform - Complete Database Schema
-- Run this SQL in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/sgbrenakklawsfbhenaj/sql/new
-- =====================================================================

-- 1. Users table (Merchants / Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. OTP Codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code_hash VARCHAR(128) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at BIGINT NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

-- 3. Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    slogan TEXT,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    delivery_type VARCHAR(20) NOT NULL DEFAULT 'flat',
    flat_fee INT NOT NULL DEFAULT 40,
    free_above INT,
    city_fees JSONB DEFAULT '{}',
    theme_color VARCHAR(10) NOT NULL DEFAULT '#E8732A',
    logo_url TEXT,
    order_seq INT NOT NULL DEFAULT 1000,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- 4. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 5. Delivery Zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    city VARCHAR(60) NOT NULL,
    fee INT NOT NULL,
    UNIQUE(store_id, city)
);

-- 6. Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    category VARCHAR(60) NOT NULL,
    description TEXT,
    image TEXT,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'نشط',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- 7. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(40) NOT NULL,
    color VARCHAR(40) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- 8. Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(60) NOT NULL,
    total_orders INT NOT NULL DEFAULT 0,
    total_spent INT NOT NULL DEFAULT 0,
    last_order VARCHAR(40),
    tag VARCHAR(40) NOT NULL DEFAULT 'جديد',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON customers(store_id, phone);

-- 9. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_city VARCHAR(60) NOT NULL,
    customer_address TEXT NOT NULL,
    customer_notes TEXT,
    subtotal INT NOT NULL CHECK (subtotal >= 0),
    delivery_fee INT NOT NULL CHECK (delivery_fee >= 0),
    total INT NOT NULL CHECK (total >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'جديد',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(store_id, status);

-- 10. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    name_snapshot VARCHAR(150) NOT NULL,
    unit_price INT NOT NULL CHECK (unit_price >= 0),
    size VARCHAR(40) NOT NULL,
    color VARCHAR(40) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 11. Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    action VARCHAR(80) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) - Allow service_role full access
-- =====================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read for storefront (anon key can read stores, products, variants)
CREATE POLICY "anon_read_stores" ON stores FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT TO anon USING (true);

-- Service role bypasses RLS automatically, but we add explicit policies
-- for the authenticated role if needed in future
CREATE POLICY "service_all_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_otp" ON otp_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_stores" ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_zones" ON delivery_zones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_products" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_variants" ON product_variants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_history" ON order_status_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_audit" ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon to insert orders & related (for public storefront checkout)
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_history" ON order_status_history FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_read_customers" ON customers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_variants" ON product_variants FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_update_stores" ON stores FOR UPDATE TO anon USING (true) WITH CHECK (true);
