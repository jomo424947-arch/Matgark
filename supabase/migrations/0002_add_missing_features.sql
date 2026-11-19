-- =====================================================================
-- Matgarak Platform - Migration 0002: Missing Features & Schema Hardening
-- Adds: Email auth columns, Categories, Discounts, Staff, Inventory Logs,
--        Store Design configs, and robust Row Level Security policies.
-- =====================================================================

-- 1. Extend users table for Email + Password Authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'merchant';

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Extend stores table for Store Design, Payments & Localization
ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sections_config JSONB DEFAULT '[]';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EGP';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS primary_locale VARCHAR(10) DEFAULT 'ar';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';

-- 3. Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(80) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- 4. Discounts table
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    code VARCHAR(40) NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'percentage' | 'fixed' | 'free_shipping'
    value INT NOT NULL CHECK (value >= 0),
    min_order_value INT DEFAULT 0,
    max_discount INT,
    usage_limit INT,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, code)
);
CREATE INDEX IF NOT EXISTS idx_discounts_store_id ON discounts(store_id);

-- 5. Staff table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'staff', -- 'owner' | 'manager' | 'staff'
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_staff_store_id ON staff(store_id);

-- 6. Inventory Logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    change_qty INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    actor VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_store_id ON inventory_logs(store_id);

-- 7. Row Level Security (RLS) for New Tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Public anon read for active categories & active discounts
CREATE POLICY "anon_read_categories" ON categories FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "anon_read_discounts" ON discounts FOR SELECT TO anon USING (is_active = true);

-- Service role full access
CREATE POLICY "srv_all_categories" ON categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_all_discounts" ON discounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_all_staff" ON staff FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_all_inventory_logs" ON inventory_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Revoke any dangerous anon update permissions from earlier schemas if present
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
DROP POLICY IF EXISTS "anon_read_customers" ON customers;
DROP POLICY IF EXISTS "anon_update_variants" ON product_variants;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_update_stores" ON stores;
