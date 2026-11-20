-- =====================================================================
-- Matgarak Platform - Migration 0003: AI Store Copilot Persistent Memory
-- & Unified Schema Completeness (Idempotent — Safe on Fresh or Existing DB)
--
-- Instructions:
-- 1. Open Supabase SQL Editor -> New Query
-- 2. Paste this ENTIRE file and click "Run"
-- =====================================================================

SET search_path TO public;

-- 1. Ensure optional email/auth & store config columns exist (from 0002)
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

-- 2. Ensure categories & discounts tables exist
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

CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    code VARCHAR(40) NOT NULL,
    type VARCHAR(30) NOT NULL,
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

-- 3. AI Conversations (Multi-chat history per merchant store)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title VARCHAR(180) NOT NULL DEFAULT 'محادثة جديدة',
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_store_updated
    ON public.ai_conversations(store_id, updated_at DESC);

-- 4. AI Messages (Intra-chat full conversation history)
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    actions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_created
    ON public.ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_store_id
    ON public.ai_messages(store_id);

-- 5. AI Long-Term Memories (Cross-chat persistent store memory per merchant)
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    memory_key VARCHAR(120) NOT NULL,
    memory_value TEXT NOT NULL,
    category VARCHAR(40) NOT NULL DEFAULT 'general',
    importance INT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(store_id, memory_key)
);
CREATE INDEX IF NOT EXISTS idx_ai_memories_store_importance
    ON public.ai_memories(store_id, importance DESC, updated_at DESC);

-- 6. Row Level Security (strictly service_role via authenticated Next.js backend)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_categories' AND tablename = 'categories') THEN
        CREATE POLICY "srv_all_categories" ON public.categories FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_discounts' AND tablename = 'discounts') THEN
        CREATE POLICY "srv_all_discounts" ON public.discounts FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_ai_conversations' AND tablename = 'ai_conversations') THEN
        CREATE POLICY "srv_all_ai_conversations" ON public.ai_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_ai_messages' AND tablename = 'ai_messages') THEN
        CREATE POLICY "srv_all_ai_messages" ON public.ai_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'srv_all_ai_memories' AND tablename = 'ai_memories') THEN
        CREATE POLICY "srv_all_ai_memories" ON public.ai_memories FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
