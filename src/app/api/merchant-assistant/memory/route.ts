import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionIdFromCookies } from "@/server/auth/session"
import { getSessionById } from "@/server/db/client"
import { isSupabaseConfigured } from "@/server/db/supabase"
import {
  createConversation,
  deleteConversation,
  deleteMemory,
  getConversationMessages,
  listConversations,
  listMemories,
  upsertMemory,
} from "@/server/ai/memoryStore"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_conversation"),
    title: z.string().min(1).max(160).optional(),
  }),
  z.object({
    action: z.literal("save_memory"),
    key: z.string().min(2).max(110),
    value: z.string().min(2).max(600),
    category: z
      .enum(["preference", "business", "inventory", "pricing", "customer", "general"])
      .default("general"),
    importance: z.number().int().min(1).max(5).default(4),
  }),
])

const deleteSchema = z.discriminatedUnion("target", [
  z.object({
    target: z.literal("conversation"),
    id: z.string().min(1).max(120),
  }),
  z.object({
    target: z.literal("memory"),
    id: z.string().min(1).max(120),
  }),
])

async function requireVerifiedStoreSession() {
  const sessionId = await getSessionIdFromCookies()
  if (!sessionId) return null
  if (!isSupabaseConfigured) return null
  const dbSession = await getSessionById(sessionId)
  if (!dbSession || !dbSession.storeId) return null
  return dbSession
}

export async function GET(req: NextRequest) {
  const session = await requireVerifiedStoreSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId")
  if (conversationId) {
    const messages = await getConversationMessages(session.storeId, conversationId, 50)
    return NextResponse.json({ ok: true, conversationId, messages })
  }

  const [conversations, memories] = await Promise.all([
    listConversations(session.storeId, 25),
    listMemories(session.storeId, 40),
  ])

  return NextResponse.json({ ok: true, conversations, memories })
}

export async function POST(req: NextRequest) {
  const session = await requireVerifiedStoreSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
      { status: 400 }
    )
  }

  if (parsed.data.action === "create_conversation") {
    const conv = await createConversation(
      session.storeId,
      session.userId,
      parsed.data.title || "محادثة جديدة"
    )
    return NextResponse.json({ ok: true, conversation: conv })
  }

  const memory = await upsertMemory(session.storeId, session.userId, {
    key: parsed.data.key,
    value: parsed.data.value,
    category: parsed.data.category,
    importance: parsed.data.importance,
  })
  return NextResponse.json({ ok: true, memory })
}

export async function DELETE(req: NextRequest) {
  const session = await requireVerifiedStoreSession()
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
      { status: 400 }
    )
  }

  if (parsed.data.target === "conversation") {
    await deleteConversation(session.storeId, parsed.data.id)
    return NextResponse.json({ ok: true })
  }

  await deleteMemory(session.storeId, parsed.data.id)
  return NextResponse.json({ ok: true })
}
