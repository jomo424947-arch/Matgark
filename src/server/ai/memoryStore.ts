import crypto from "node:crypto"
import { supabaseAdmin, isSupabaseConfigured } from "@/server/db/supabase"

export interface AiConversationRecord {
  id: string
  storeId: string
  title: string
  summary?: string
  createdAt: string
  updatedAt: string
}

export interface AiMessageRecord {
  id: string
  conversationId: string
  storeId: string
  role: "user" | "assistant"
  content: string
  actions?: Array<{
    id: string
    type: string
    titleAr: string
    titleEn: string
    href?: string
    dbPersisted?: boolean
  }>
  memoriesSaved?: Array<{ key: string; value: string; category: string }>
  createdAt: string
}

export interface AiMemoryRecord {
  id: string
  storeId: string
  memoryKey: string
  memoryValue: string
  category: string
  importance: number
  createdAt: string
  updatedAt: string
}

export type MemoryBackendMode = "supabase_tables" | "supabase_audit_fallback" | "memory_ephemeral"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

// Cache whether dedicated ai_* tables are present in PostgREST schema cache
let dedicatedTablesAvailable: boolean | null = null
let lastCheckAt = 0

async function hasDedicatedAiTables(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const now = Date.now()
  if (dedicatedTablesAvailable !== null && now - lastCheckAt < 60_000) {
    return dedicatedTablesAvailable
  }
  const [cRes, mRes, memRes] = await Promise.all([
    supabaseAdmin.from("ai_conversations").select("id").limit(1),
    supabaseAdmin.from("ai_messages").select("id").limit(1),
    supabaseAdmin.from("ai_memories").select("id").limit(1),
  ])

  dedicatedTablesAvailable =
    !cRes.error &&
    Array.isArray(cRes.data) &&
    !mRes.error &&
    Array.isArray(mRes.data) &&
    !memRes.error &&
    Array.isArray(memRes.data)
  lastCheckAt = now
  return dedicatedTablesAvailable
}

export async function getMemoryBackendMode(storeId: string): Promise<MemoryBackendMode> {
  if (!isSupabaseConfigured || !isUuid(storeId)) return "memory_ephemeral"
  return (await hasDedicatedAiTables()) ? "supabase_tables" : "supabase_audit_fallback"
}

// ── Audit-log JSON helpers (zero-downtime real Supabase persistence before migration 0003) ──

const ACTION_CONV = "ai_conv_v1"
const ACTION_CONV_DEL = "ai_conv_del_v1"
const ACTION_MSG = "ai_msg_v1"
const ACTION_MEM = "ai_mem_v1"
const ACTION_MEM_DEL = "ai_mem_del_v1"

function safeJsonParse<T>(raw: unknown): T | null {
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// Conversations (Multi-Chat Management)
// ─────────────────────────────────────────────

export async function listConversations(
  storeId: string,
  limit = 25
): Promise<AiConversationRecord[]> {
  if (!isSupabaseConfigured || !isUuid(storeId)) return []

  if (await hasDedicatedAiTables()) {
    const { data, error } = await supabaseAdmin
      .from("ai_conversations")
      .select("*")
      .eq("store_id", storeId)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (!error && Array.isArray(data)) {
      return data.map((r) => ({
        id: r.id as string,
        storeId: r.store_id as string,
        title: (r.title as string) || "محادثة جديدة",
        summary: (r.summary as string) || undefined,
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      }))
    }
    dedicatedTablesAvailable = false
  }

  // Fallback directly in Supabase audit_logs scoped strictly by store_id
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id, action, details, created_at")
    .eq("store_id", storeId)
    .in("action", [ACTION_CONV, ACTION_CONV_DEL])
    .order("created_at", { ascending: true })
    .limit(400)

  if (error || !data) return []

  const convMap = new Map<string, AiConversationRecord>()
  const deleted = new Set<string>()

  for (const row of data) {
    const payload = safeJsonParse<Record<string, unknown>>(row.details)
    if (!payload) continue
    const cid = String(payload.id || "")
    if (!cid) continue

    if (row.action === ACTION_CONV_DEL) {
      deleted.add(cid)
      convMap.delete(cid)
    } else if (row.action === ACTION_CONV && !deleted.has(cid)) {
      const existing = convMap.get(cid)
      convMap.set(cid, {
        id: cid,
        storeId,
        title: String(payload.title || existing?.title || "محادثة جديدة"),
        summary: payload.summary ? String(payload.summary) : existing?.summary,
        createdAt: existing?.createdAt || String(payload.createdAt || row.created_at),
        updatedAt: String(payload.updatedAt || row.created_at),
      })
    }
  }

  return Array.from(convMap.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}

export async function createConversation(
  storeId: string,
  userId: string | null,
  title = "محادثة جديدة"
): Promise<AiConversationRecord> {
  const cleanTitle = title.trim().slice(0, 160) || "محادثة جديدة"
  const nowIso = new Date().toISOString()

  if (!isSupabaseConfigured || !isUuid(storeId)) {
    return {
      id: crypto.randomUUID(),
      storeId,
      title: cleanTitle,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
  }

  if (await hasDedicatedAiTables()) {
    const { data, error } = await supabaseAdmin
      .from("ai_conversations")
      .insert({
        store_id: storeId,
        user_id: userId && isUuid(userId) ? userId : null,
        title: cleanTitle,
      })
      .select()
      .single()

    if (!error && data) {
      return {
        id: data.id as string,
        storeId: data.store_id as string,
        title: data.title as string,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      }
    }
  }

  const convId = crypto.randomUUID()
  const record: AiConversationRecord = {
    id: convId,
    storeId,
    title: cleanTitle,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action: ACTION_CONV,
    details: JSON.stringify(record),
  })
  return record
}

export async function touchConversation(
  storeId: string,
  conversationId: string,
  updates: { title?: string; summary?: string }
): Promise<void> {
  if (!isSupabaseConfigured || !isUuid(storeId)) return
  const nowIso = new Date().toISOString()

  if (await hasDedicatedAiTables()) {
    const patch: Record<string, unknown> = { updated_at: nowIso }
    if (updates.title) patch.title = updates.title.trim().slice(0, 160)
    if (updates.summary) patch.summary = updates.summary.trim().slice(0, 500)
    const { error } = await supabaseAdmin
      .from("ai_conversations")
      .update(patch)
      .eq("id", conversationId)
      .eq("store_id", storeId)
    if (!error) return
    dedicatedTablesAvailable = false
  }

  await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action: ACTION_CONV,
    details: JSON.stringify({
      id: conversationId,
      title: updates.title?.trim().slice(0, 160),
      summary: updates.summary?.trim().slice(0, 500),
      updatedAt: nowIso,
    }),
  })
}

export async function deleteConversation(
  storeId: string,
  conversationId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !isUuid(storeId)) return true

  if (await hasDedicatedAiTables()) {
    const { error } = await supabaseAdmin
      .from("ai_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("store_id", storeId)
    if (!error) return true
    dedicatedTablesAvailable = false
  }

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action: ACTION_CONV_DEL,
    details: JSON.stringify({ id: conversationId }),
  })
  return !error
}

// ─────────────────────────────────────────────
// Messages (Intra-Chat Persistent Memory)
// ─────────────────────────────────────────────

export async function getConversationMessages(
  storeId: string,
  conversationId: string,
  limit = 40
): Promise<AiMessageRecord[]> {
  if (!isSupabaseConfigured || !isUuid(storeId) || !conversationId) return []

  if (await hasDedicatedAiTables()) {
    const { data, error } = await supabaseAdmin
      .from("ai_messages")
      .select("*")
      .eq("store_id", storeId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit)

    if (!error && Array.isArray(data)) {
      return data.map((r) => ({
        id: r.id as string,
        conversationId: r.conversation_id as string,
        storeId: r.store_id as string,
        role: r.role as "user" | "assistant",
        content: r.content as string,
        actions: Array.isArray(r.actions_json) ? r.actions_json : [],
        createdAt: r.created_at as string,
      }))
    }
    dedicatedTablesAvailable = false
  }

  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id, details, created_at")
    .eq("store_id", storeId)
    .eq("action", ACTION_MSG)
    .order("created_at", { ascending: true })
    .limit(500)

  if (error || !data) return []

  const results: AiMessageRecord[] = []
  for (const row of data) {
    const payload = safeJsonParse<AiMessageRecord>(row.details)
    if (payload && payload.conversationId === conversationId) {
      results.push({
        ...payload,
        id: payload.id || (row.id as string),
        storeId,
        createdAt: payload.createdAt || (row.created_at as string),
      })
    }
  }
  return results.slice(-limit)
}

export async function appendConversationMessage(
  storeId: string,
  conversationId: string,
  input: {
    role: "user" | "assistant"
    content: string
    actions?: AiMessageRecord["actions"]
    memoriesSaved?: AiMessageRecord["memoriesSaved"]
  }
): Promise<AiMessageRecord> {
  const nowIso = new Date().toISOString()
  const msgId = crypto.randomUUID()
  const record: AiMessageRecord = {
    id: msgId,
    conversationId,
    storeId,
    role: input.role,
    content: input.content.slice(0, 8000),
    actions: input.actions || [],
    memoriesSaved: input.memoriesSaved || [],
    createdAt: nowIso,
  }

  if (!isSupabaseConfigured || !isUuid(storeId)) {
    return record
  }

  if (await hasDedicatedAiTables()) {
    const { data, error } = await supabaseAdmin
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        store_id: storeId,
        role: record.role,
        content: record.content,
        actions_json: record.actions || [],
      })
      .select()
      .single()

    if (!error && data) {
      return {
        ...record,
        id: data.id as string,
        createdAt: data.created_at as string,
      }
    }
  }

  await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action: ACTION_MSG,
    details: JSON.stringify(record),
  })
  return record
}

// ─────────────────────────────────────────────
// Long-Term Memories (Cross-Chat Memory in Supabase)
// ─────────────────────────────────────────────

export async function listMemories(
  storeId: string,
  limit = 40
): Promise<AiMemoryRecord[]> {
  if (!isSupabaseConfigured || !isUuid(storeId)) return []

  if (await hasDedicatedAiTables()) {
    const { data, error } = await supabaseAdmin
      .from("ai_memories")
      .select("*")
      .eq("store_id", storeId)
      .order("importance", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (!error && Array.isArray(data)) {
      return data.map((r) => ({
        id: r.id as string,
        storeId: r.store_id as string,
        memoryKey: r.memory_key as string,
        memoryValue: r.memory_value as string,
        category: (r.category as string) || "general",
        importance: (r.importance as number) || 3,
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      }))
    }
    dedicatedTablesAvailable = false
  }

  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id, action, details, created_at")
    .eq("store_id", storeId)
    .in("action", [ACTION_MEM, ACTION_MEM_DEL])
    .order("created_at", { ascending: true })
    .limit(400)

  if (error || !data) return []

  const byKey = new Map<string, AiMemoryRecord>()
  const byIdToKey = new Map<string, string>()

  for (const row of data) {
    const payload = safeJsonParse<Record<string, unknown>>(row.details)
    if (!payload) continue

    if (row.action === ACTION_MEM_DEL) {
      const targetId = String(payload.id || "")
      const targetKey = String(payload.memoryKey || byIdToKey.get(targetId) || "")
      if (targetKey) {
        byKey.delete(targetKey)
      }
    } else if (row.action === ACTION_MEM) {
      const key = String(payload.memoryKey || "").trim()
      const val = String(payload.memoryValue || "").trim()
      if (!key || !val) continue
      const id = String(payload.id || row.id)
      const prev = byKey.get(key)
      byKey.set(key, {
        id,
        storeId,
        memoryKey: key,
        memoryValue: val,
        category: String(payload.category || "general"),
        importance: Number(payload.importance) || 3,
        createdAt: prev?.createdAt || String(payload.createdAt || row.created_at),
        updatedAt: String(payload.updatedAt || row.created_at),
      })
      byIdToKey.set(id, key)
    }
  }

  return Array.from(byKey.values())
    .sort((a, b) => b.importance - a.importance || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
}

export async function upsertMemory(
  storeId: string,
  userId: string | null,
  input: {
    key: string
    value: string
    category?: string
    importance?: number
  }
): Promise<AiMemoryRecord> {
  const cleanKey = input.key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .slice(0, 110)
  const cleanValue = input.value.trim().slice(0, 600)
  const cleanCategory = (input.category || "general").trim().slice(0, 36)
  const importance = Math.min(5, Math.max(1, Math.round(input.importance ?? 4)))
  const nowIso = new Date().toISOString()

  if (!isSupabaseConfigured || !isUuid(storeId)) {
    return {
      id: crypto.randomUUID(),
      storeId,
      memoryKey: cleanKey,
      memoryValue: cleanValue,
      category: cleanCategory,
      importance,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
  }

  if (await hasDedicatedAiTables()) {
    const { data, error } = await supabaseAdmin
      .from("ai_memories")
      .upsert(
        {
          store_id: storeId,
          user_id: userId && isUuid(userId) ? userId : null,
          memory_key: cleanKey,
          memory_value: cleanValue,
          category: cleanCategory,
          importance,
          updated_at: nowIso,
        },
        { onConflict: "store_id,memory_key" }
      )
      .select()
      .single()

    if (!error && data) {
      return {
        id: data.id as string,
        storeId: data.store_id as string,
        memoryKey: data.memory_key as string,
        memoryValue: data.memory_value as string,
        category: data.category as string,
        importance: data.importance as number,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
      }
    }
  }

  const memId = crypto.randomUUID()
  const record: AiMemoryRecord = {
    id: memId,
    storeId,
    memoryKey: cleanKey,
    memoryValue: cleanValue,
    category: cleanCategory,
    importance,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action: ACTION_MEM,
    details: JSON.stringify(record),
  })
  return record
}

export async function deleteMemory(
  storeId: string,
  memoryId: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !isUuid(storeId)) return true

  if (await hasDedicatedAiTables()) {
    const { error } = await supabaseAdmin
      .from("ai_memories")
      .delete()
      .eq("id", memoryId)
      .eq("store_id", storeId)
    if (!error) return true
    dedicatedTablesAvailable = false
  }

  const current = await listMemories(storeId, 100)
  const target = current.find((m) => m.id === memoryId)

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    store_id: storeId,
    action: ACTION_MEM_DEL,
    details: JSON.stringify({
      id: memoryId,
      memoryKey: target?.memoryKey || "",
    }),
  })
  return !error
}

export async function getRecentCrossChatDigests(
  storeId: string,
  excludeConversationId?: string,
  limit = 5
): Promise<Array<{ conversationId: string; title: string; updatedAt: string; lastMessages: string[] }>> {
  const convs = await listConversations(storeId, limit + 3)
  const others = convs
    .filter((c) => c.id !== excludeConversationId)
    .slice(0, limit)

  const digests: Array<{
    conversationId: string
    title: string
    updatedAt: string
    lastMessages: string[]
  }> = []

  for (const conv of others) {
    const msgs = await getConversationMessages(storeId, conv.id, 6)
    if (msgs.length === 0) continue
    digests.push({
      conversationId: conv.id,
      title: conv.title,
      updatedAt: conv.updatedAt,
      lastMessages: msgs.slice(-4).map((m) => `${m.role === "user" ? "Merchant" : "Copilot"}: ${m.content.slice(0, 180)}`),
    })
  }
  return digests
}
