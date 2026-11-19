-- =====================================================================
-- Matgarak Platform - Migration 0002: Missing Features & Schema Hardening
-- Self-contained: Works safely on both fresh and existing Supabase databases
-- =====================================================================

-- 1. Ensure search_path is explicitly set to public
SET search_path TO public;

-- 2. Ensure base users and stores tables exist (if run on a fresh project)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(100),
    role VARCHAR(30) DEFAULT 'merchant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    theme_config JSONB DEFAULT '{}',
    sections_config JSONB DEFAULT '[]',
    payment_config JSONB DEFAULT '{}',
    currency VARCHAR(10) DEFAULT 'EGP',
    primary_locale VARCHAR(10) DEFAULT 'ar',
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);

-- 3. Safely add new columns if tables already existed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'merchant';

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS sections_config JSONB DEFAULT '[]';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS payment_config JSONB DEFAULT '{}';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EGP';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS primary_locale VARCHAR(10) DEFAULT 'ar';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';

-- 4. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(80) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON public.categories(store_id);

-- 5. Discounts table
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_discounts_store_id ON public.discounts(store_id);

-- 6. Staff table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'staff',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_staff_store_id ON public.staff(store_id);

-- 7. Inventory Logs table
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID,
    variant_id UUID,
    change_qty INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    actor VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_store_id ON public.inventory_logs(store_id);

-- 8. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation (no errors if policies exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_read_categories' AND tablename = 'categories') THEN
        CREATE POLICY "anon_read_categories" ON public.categories FOR SELECT TO anon USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'anon_read_discounts' AND tablename = 'discounts') THEN
        CREATE POLICY "anon_read_discounts" ON public.discounts FOR SELECT TO anon USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_categories' AND tablename = 'categories') THEN
        CREATE POLICY "srv_all_categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_discounts' AND tablename = 'discounts') THEN
        CREATE POLICY "srv_all_discounts" ON public.discounts FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_staff' AND tablename = 'staff') THEN
        CREATE POLICY "srv_all_staff" ON public.staff FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_inventory_logs' AND tablename = 'inventory_logs') THEN
        CREATE POLICY "srv_all_inventory_logs" ON public.inventory_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
