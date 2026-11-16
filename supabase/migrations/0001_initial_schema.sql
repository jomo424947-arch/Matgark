-- Migration: 0001_initial_schema.sql
-- Description: Complete initial schema for Matgarak platform with multi-tenant isolation, RLS, and constraints.

-- 1. Users table (Merchants / Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. OTP Codes table (Hashed 6-digit verification codes)
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

-- 3. Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 4. Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    slogan TEXT,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    delivery_type VARCHAR(20) NOT NULL DEFAULT 'flat', -- 'flat' | 'by_city'
    flat_fee INT NOT NULL DEFAULT 40,
    free_above INT,
    theme_color VARCHAR(10) NOT NULL DEFAULT '#E8732A',
    logo_url TEXT,
    order_seq INT NOT NULL DEFAULT 1000,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- 5. Delivery Zones (optional city fees)
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
    status VARCHAR(30) NOT NULL DEFAULT 'نشط', -- 'نشط' | 'مخزون منخفض' | 'نفذ المخزون'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);

-- 7. Product Variants (sizes, colors, per-variant inventory)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(40) NOT NULL,
    color VARCHAR(40) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- 8. Customers table (Scoped per store)
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
    status VARCHAR(30) NOT NULL DEFAULT 'جديد', -- 'جديد' | 'مؤكد' | 'جاري الشحن' | 'تم التسليم' | 'ملغي'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(store_id, status);

-- 10. Order Items table (Immutable historical snapshot)
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

-- 11. Order Status History log
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

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- -------------------------------------------------------------
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read store and products by slug / store_id
CREATE POLICY "Public stores are readable" ON stores FOR SELECT USING (true);
CREATE POLICY "Public products are readable" ON products FOR SELECT USING (true);
CREATE POLICY "Public variants are readable" ON product_variants FOR SELECT USING (true);

-- Store owners can manage their own data
CREATE POLICY "Store owners manage their store" ON stores
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Store owners manage products" ON products
    FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Store owners manage orders" ON orders
    FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Store owners manage customers" ON customers
    FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.owner_id = auth.uid()));

CREATE POLICY "Store owners view audit logs" ON audit_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = audit_logs.store_id AND stores.owner_id = auth.uid()));
