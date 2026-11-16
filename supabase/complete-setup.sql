-- =====================================================================
-- Matgarak Platform - COMPLETE SETUP (Schema + Seed Data)
-- 
-- 📋 Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/sgbrenakklawsfbhenaj/sql/new
-- 2. Paste this ENTIRE file
-- 3. Click "Run"
-- =====================================================================

-- ======================== SCHEMA ========================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    city VARCHAR(60) NOT NULL,
    fee INT NOT NULL,
    UNIQUE(store_id, city)
);

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

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(40) NOT NULL,
    color VARCHAR(40) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

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

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    action VARCHAR(80) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ======================== RLS ========================

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

-- Public storefront reads
CREATE POLICY "anon_read_stores" ON stores FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_variants" ON product_variants FOR SELECT TO anon USING (true);

-- Service role full access
CREATE POLICY "srv_users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_otp" ON otp_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_stores" ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_zones" ON delivery_zones FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_products" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_variants" ON product_variants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_orders" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_items" ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_history" ON order_status_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "srv_audit" ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ======================== SEED DATA ========================

-- Insert merchant user
INSERT INTO users (phone) VALUES ('01012345678');

-- Insert store
INSERT INTO stores (owner_id, name, slug, slogan, phone, whatsapp, delivery_type, flat_fee, free_above, city_fees, theme_color, order_seq, plan)
SELECT u.id, 'براند كايرو كوتور', 'cairo-couture', 'أحدث صيحات الملابس الشتوية والكاجوال العصرية في مصر',
       '01012345678', '01012345678', 'flat', 40, 1000,
       '{"القاهرة": 40, "الجيزة": 45, "الإسكندرية": 60}'::jsonb,
       '#E8732A', 1048, 'pro'
FROM users u WHERE u.phone = '01012345678';

-- Insert products
INSERT INTO products (store_id, name, price, category, description, image, stock, status)
SELECT s.id, 'جاكيت شتوي أوفرسايز صوف فاخر', 850, 'ملابس شتوية',
       'خامة صوف معالج ضد الانكماش مع بطانة داخلية دافئة.', '🧥', 12, 'نشط'
FROM stores s WHERE s.slug = 'cairo-couture';

INSERT INTO products (store_id, name, price, category, description, image, stock, status)
SELECT s.id, 'سنيكرز جلد أبيض مريح', 620, 'أحذية',
       'نعل طبي مبطن مريح للارتداء طوال اليوم وتصميم أنيق.', '👟', 4, 'مخزون منخفض'
FROM stores s WHERE s.slug = 'cairo-couture';

INSERT INTO products (store_id, name, price, category, description, image, stock, status)
SELECT s.id, 'هودي ميلتون مصري مبطن', 550, 'ملابس كاجوال',
       'قطن مصري 100% عالي الجودة مع وبرة ناعمة داخلية.', '👕', 20, 'نشط'
FROM stores s WHERE s.slug = 'cairo-couture';

INSERT INTO products (store_id, name, price, category, description, image, stock, status)
SELECT s.id, 'بنطلون كارجو قطن بجيوب', 490, 'بناطيل',
       'خامة قطنية متينة مع 6 جيوب عملية وتصميم مريح.', '👖', 0, 'نفذ المخزون'
FROM stores s WHERE s.slug = 'cairo-couture';

-- Insert product variants
INSERT INTO product_variants (product_id, size, color, stock)
SELECT p.id, v.size, v.color, v.stock
FROM products p, (VALUES
  ('جاكيت شتوي أوفرسايز صوف فاخر', 'M', 'أسود', 4),
  ('جاكيت شتوي أوفرسايز صوف فاخر', 'L', 'أسود', 4),
  ('جاكيت شتوي أوفرسايز صوف فاخر', 'XL', 'زيتي', 4),
  ('سنيكرز جلد أبيض مريح', '38', 'أبيض', 1),
  ('سنيكرز جلد أبيض مريح', '39', 'أبيض', 1),
  ('سنيكرز جلد أبيض مريح', '40', 'أبيض', 1),
  ('سنيكرز جلد أبيض مريح', '41', 'أبيض', 1),
  ('هودي ميلتون مصري مبطن', 'S', 'رمادي', 5),
  ('هودي ميلتون مصري مبطن', 'M', 'رمادي', 5),
  ('هودي ميلتون مصري مبطن', 'L', 'كحلي', 5),
  ('هودي ميلتون مصري مبطن', 'XL', 'نبيتي', 5),
  ('بنطلون كارجو قطن بجيوب', '30', 'بيج', 0),
  ('بنطلون كارجو قطن بجيوب', '32', 'زيتي', 0),
  ('بنطلون كارجو قطن بجيوب', '34', 'أسود', 0)
) AS v(product_name, size, color, stock)
WHERE p.name = v.product_name;

-- Insert customers
INSERT INTO customers (store_id, name, phone, city, total_orders, total_spent, last_order, tag)
SELECT s.id, c.name, c.phone, c.city, c.total_orders, c.total_spent, c.last_order, c.tag
FROM stores s, (VALUES
  ('محمد علي', '01098765432', 'القاهرة', 3, 2450, 'اليوم', 'عميل مميز ⭐'),
  ('نورين شريف', '01234567890', 'الجيزة', 2, 1840, 'اليوم', 'نشط'),
  ('عمر خالد', '01122334455', 'الإسكندرية', 1, 590, 'أمس', 'جديد'),
  ('ياسمين فهمي', '01599887766', 'القاهرة', 4, 3120, 'منذ يومين', 'عميل مميز ⭐'),
  ('أحمد حسام', '01011223388', 'المنصورة', 1, 490, 'منذ 4 أيام', 'جديد')
) AS c(name, phone, city, total_orders, total_spent, last_order, tag)
WHERE s.slug = 'cairo-couture';

-- Insert orders
INSERT INTO orders (order_number, store_id, customer_id, customer_name, customer_phone, customer_city, customer_address, customer_notes, subtotal, delivery_fee, total, status, created_at)
SELECT '1048', s.id, c.id, 'محمد علي', '01098765432', 'القاهرة',
       'مدينة نصر، شارع عباس العقاد، عمارة 14، شقة 5', 'يرجى الاتصال قبل الوصول',
       850, 40, 890, 'جديد', '2026-01-14T15:40:00.000Z'
FROM stores s, customers c WHERE s.slug = 'cairo-couture' AND c.phone = '01098765432' AND c.store_id = s.id;

INSERT INTO orders (order_number, store_id, customer_id, customer_name, customer_phone, customer_city, customer_address, customer_notes, subtotal, delivery_fee, total, status, created_at)
SELECT '1047', s.id, c.id, 'نورين شريف', '01234567890', 'الجيزة',
       'الدقي، شارع مصدق، برج الأطباء', '',
       1170, 0, 1170, 'مؤكد', '2026-01-14T13:15:00.000Z'
FROM stores s, customers c WHERE s.slug = 'cairo-couture' AND c.phone = '01234567890' AND c.store_id = s.id;

INSERT INTO orders (order_number, store_id, customer_id, customer_name, customer_phone, customer_city, customer_address, customer_notes, subtotal, delivery_fee, total, status, created_at)
SELECT '1046', s.id, c.id, 'عمر خالد', '01122334455', 'الإسكندرية',
       'سموحة، بجوار نادي سموحة، عمارة الأمل', 'مندوب الشحن: أ/ هاني (01011223344)',
       550, 40, 590, 'جاري الشحن', '2026-01-13T20:30:00.000Z'
FROM stores s, customers c WHERE s.slug = 'cairo-couture' AND c.phone = '01122334455' AND c.store_id = s.id;

INSERT INTO orders (order_number, store_id, customer_id, customer_name, customer_phone, customer_city, customer_address, customer_notes, subtotal, delivery_fee, total, status, created_at)
SELECT '1045', s.id, c.id, 'ياسمين فهمي', '01599887766', 'القاهرة',
       'التجمع الخامس، النرجس 2، فيلا 18', 'تم تحصيل المبلغ كاش',
       850, 0, 850, 'تم التسليم', '2026-01-12T10:00:00.000Z'
FROM stores s, customers c WHERE s.slug = 'cairo-couture' AND c.phone = '01599887766' AND c.store_id = s.id;

-- Insert order items
INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, unit_price, size, color, quantity)
SELECT o.id, p.id, pv.id, 'جاكيت شتوي أوفرسايز صوف فاخر', 850, 'L', 'أسود', 1
FROM orders o
JOIN stores s ON o.store_id = s.id AND s.slug = 'cairo-couture'
JOIN products p ON p.store_id = s.id AND p.name = 'جاكيت شتوي أوفرسايز صوف فاخر'
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.size = 'L' AND pv.color = 'أسود'
WHERE o.order_number = '1048';

INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, unit_price, size, color, quantity)
SELECT o.id, p.id, pv.id, 'سنيكرز جلد أبيض مريح', 620, '38', 'أبيض', 1
FROM orders o
JOIN stores s ON o.store_id = s.id AND s.slug = 'cairo-couture'
JOIN products p ON p.store_id = s.id AND p.name = 'سنيكرز جلد أبيض مريح'
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.size = '38' AND pv.color = 'أبيض'
WHERE o.order_number = '1047';

INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, unit_price, size, color, quantity)
SELECT o.id, p.id, pv.id, 'هودي ميلتون مصري مبطن', 550, 'M', 'رمادي', 1
FROM orders o
JOIN stores s ON o.store_id = s.id AND s.slug = 'cairo-couture'
JOIN products p ON p.store_id = s.id AND p.name = 'هودي ميلتون مصري مبطن'
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.size = 'M' AND pv.color = 'رمادي'
WHERE o.order_number = '1047';

INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, unit_price, size, color, quantity)
SELECT o.id, p.id, pv.id, 'هودي ميلتون مصري مبطن', 550, 'XL', 'نبيتي', 1
FROM orders o
JOIN stores s ON o.store_id = s.id AND s.slug = 'cairo-couture'
JOIN products p ON p.store_id = s.id AND p.name = 'هودي ميلتون مصري مبطن'
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.size = 'XL' AND pv.color = 'نبيتي'
WHERE o.order_number = '1046';

INSERT INTO order_items (order_id, product_id, variant_id, name_snapshot, unit_price, size, color, quantity)
SELECT o.id, p.id, pv.id, 'جاكيت شتوي أوفرسايز صوف فاخر', 850, 'M', 'أسود', 1
FROM orders o
JOIN stores s ON o.store_id = s.id AND s.slug = 'cairo-couture'
JOIN products p ON p.store_id = s.id AND p.name = 'جاكيت شتوي أوفرسايز صوف فاخر'
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.size = 'M' AND pv.color = 'أسود'
WHERE o.order_number = '1045';

-- Insert order status history
INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'جديد', 'تم استلام الطلب من متجر العميل', '2026-01-14T15:40:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1048';

INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'جديد', NULL, '2026-01-14T13:15:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1047';

INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'مؤكد', 'تم التأكيد هاتفياً', '2026-01-14T13:30:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1047';

INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'جديد', NULL, '2026-01-13T20:30:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1046';

INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'جاري الشحن', NULL, '2026-01-14T09:00:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1046';

INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'جديد', NULL, '2026-01-12T10:00:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1045';

INSERT INTO order_status_history (order_id, status, note, created_at)
SELECT o.id, 'تم التسليم', NULL, '2026-01-13T17:00:00.000Z'
FROM orders o JOIN stores s ON o.store_id = s.id WHERE s.slug = 'cairo-couture' AND o.order_number = '1045';

-- Done! ✅
