import { spawn } from "node:child_process"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionIdFromCookies } from "@/server/auth/session"
import { getSessionById, getStoreById } from "@/server/db/client"
import { isSupabaseConfigured } from "@/server/db/supabase"
import {
  appendConversationMessage,
  createConversation,
  getConversationMessages,
  getMemoryBackendMode,
  getRecentCrossChatDigests,
  listConversations,
  listMemories,
  touchConversation,
  upsertMemory,
} from "@/server/ai/memoryStore"
import { buildDirectSupabaseStoreContext } from "@/server/ai/storeDbContext"
import { executeAssistantActionInSupabase } from "@/server/ai/executeDbAction"
import { assistantMemorySchema } from "@/lib/ai/assistantActions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
})

const requestSchema = z.object({
  conversationId: z.string().max(120).optional(),
  messages: z.array(messageSchema).min(1).max(30),
  locale: z.enum(["ar", "en"]).default("ar"),
  storeContext: z.record(z.string(), z.unknown()).default({}),
})

async function resolveAuthenticatedStore(): Promise<{
  sessionId: string
  userId: string | null
  storeId: string | null
  storeName?: string
  storeSlug?: string
} | null> {
  const sessionId = await getSessionIdFromCookies()
  if (!sessionId) return null

  if (isSupabaseConfigured) {
    const dbSession = await getSessionById(sessionId)
    if (dbSession) {
      const dbStore = dbSession.storeId ? await getStoreById(dbSession.storeId) : null
      return {
        sessionId,
        userId: dbSession.userId,
        storeId: dbSession.storeId,
        storeName: dbStore?.name,
        storeSlug: dbStore?.slug,
      }
    }
  }

  return {
    sessionId,
    userId: null,
    storeId: null,
  }
}

export async function GET(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY?.trim() || ""
  const groqConfigured = Boolean(groqKey && !groqKey.startsWith("YOUR_"))
  const model = process.env.GROQ_MODEL?.trim() || "qwen/qwen3.8-27b"

  const auth = await resolveAuthenticatedStore()
  if (!auth) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      runtime: "python3",
      provider: "groq",
      groqConfigured,
      supabaseConfigured: isSupabaseConfigured,
      model,
    })
  }

  const verifiedStoreId = auth.storeId || ""
  const memoryBackend = await getMemoryBackendMode(verifiedStoreId)
  const requestedConvId = req.nextUrl.searchParams.get("conversationId") || undefined

  const [conversations, memories] = verifiedStoreId
    ? await Promise.all([
        listConversations(verifiedStoreId, 25),
        listMemories(verifiedStoreId, 40),
      ])
    : [[], []]

  const activeConversationId =
    requestedConvId && conversations.some((c) => c.id === requestedConvId)
      ? requestedConvId
      : conversations[0]?.id || null

  const messages =
    verifiedStoreId && activeConversationId
      ? await getConversationMessages(verifiedStoreId, activeConversationId, 40)
      : []

  const dbCtx = verifiedStoreId
    ? await buildDirectSupabaseStoreContext(verifiedStoreId, {})
    : null

  return NextResponse.json({
    ok: true,
    authenticated: true,
    runtime: "python3",
    provider: "groq",
    groqConfigured,
    supabaseConfigured: isSupabaseConfigured,
    dbConnected: Boolean(dbCtx?.connected),
    dbStoreName: dbCtx?.storeName || auth.storeName || null,
    dbStoreSlug: dbCtx?.storeSlug || auth.storeSlug || null,
    dbSummary: dbCtx?.dbSummary || null,
    memoryBackend,
    model,
    conversations,
    activeConversationId,
    messages,
    memories,
  })
}

export async function POST(req: NextRequest) {
  // Strictly enforce authenticated merchant session (HttpOnly signed cookie)
  const auth = await resolveAuthenticatedStore()
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "يرجى تسجيل الدخول كصاحب متجر لاستخدام المساعد الذكي." },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message || "Invalid request payload" },
      { status: 400 }
    )
  }

  // Strictly confine Python script path within project python-ai directory
  const baseDir = path.resolve(process.cwd(), "python-ai")
  const scriptPath = path.resolve(baseDir, "merchant_agent.py")
  if (!scriptPath.startsWith(baseDir + path.sep)) {
    return NextResponse.json({ ok: false, error: "Invalid agent script path" }, { status: 500 })
  }

  const verifiedStoreId = auth.storeId || ""
  const latestUserMessage =
    [...parsed.data.messages].reverse().find((m) => m.role === "user")?.content || ""

  // 1. Resolve or create Supabase conversation strictly scoped to verifiedStoreId
  let activeConvId = parsed.data.conversationId || ""
  let convTitle = latestUserMessage.slice(0, 72) || "محادثة جديدة"

  if (verifiedStoreId) {
    if (!activeConvId) {
      const created = await createConversation(verifiedStoreId, auth.userId, convTitle)
      activeConvId = created.id
      convTitle = created.title
    } else {
      const existingConvs = await listConversations(verifiedStoreId, 50)
      const matched = existingConvs.find((c) => c.id === activeConvId)
      if (!matched) {
        // Security: never allow attaching to a conversation outside verifiedStoreId
        const created = await createConversation(verifiedStoreId, auth.userId, convTitle)
        activeConvId = created.id
        convTitle = created.title
      } else {
        convTitle = matched.title
      }
    }
  }

  // 2. Load intra-chat history + long-term cross-chat memories + live direct Supabase store DB context
  const [storedHistory, memories, recentChats, liveDbCtx, memoryBackend] =
    verifiedStoreId
      ? await Promise.all([
          activeConvId ? getConversationMessages(verifiedStoreId, activeConvId, 24) : Promise.resolve([]),
          listMemories(verifiedStoreId, 40),
          getRecentCrossChatDigests(verifiedStoreId, activeConvId, 5),
          buildDirectSupabaseStoreContext(verifiedStoreId, parsed.data.storeContext),
          getMemoryBackendMode(verifiedStoreId),
        ])
      : [
          [],
          [],
          [],
          {
            connected: false,
            storeId: "",
            mergedContext: parsed.data.storeContext,
            dbSummary: { productsCount: 0, ordersCount: 0, customersCount: 0, totalRevenue: 0, pendingOrders: 0 },
          },
          "memory_ephemeral" as const,
        ]

  // Persist user message immediately into Supabase for durable intra-chat memory
  if (verifiedStoreId && activeConvId && latestUserMessage) {
    await appendConversationMessage(verifiedStoreId, activeConvId, {
      role: "user",
      content: latestUserMessage,
    })
    if (storedHistory.length === 0) {
      await touchConversation(verifiedStoreId, activeConvId, {
        title: latestUserMessage.slice(0, 72),
      })
    }
  }

  // Build authoritative intra-chat conversation window (Supabase history + latest user turn)
  const authoritativeMessages =
    storedHistory.length > 0
      ? [
          ...storedHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: latestUserMessage },
        ]
      : parsed.data.messages

  const originHeader =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://187.126.0.23:3002"
  const resolvedSlug =
    liveDbCtx.storeSlug ||
    String(
      ((liveDbCtx.mergedContext.store as Record<string, unknown>) || {}).slug ||
        "menz-club"
    )
  const liveStoreUrl = `${originHeader.replace(/\/+$/, "")}/s/${resolvedSlug}`

  const pythonPayload = {
    locale: parsed.data.locale,
    messages: authoritativeMessages.slice(-22),
    storeContext: liveDbCtx.mergedContext,
    memories: memories.map((m) => ({
      memoryKey: m.memoryKey,
      memoryValue: m.memoryValue,
      category: m.category,
      importance: m.importance,
    })),
    recentChats,
    storeUrl: liveStoreUrl,
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const safeClose = () => {
        if (!closed) {
          closed = true
          try {
            controller.close()
          } catch {
            // Stream already closed
          }
        }
      }

      const sendSseObj = (obj: Record<string, unknown>) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
        } catch {
          safeClose()
        }
      }

      // Immediately notify client of active Supabase conversation ID & DB connection
      if (activeConvId) {
        sendSseObj({
          type: "conversation",
          conversationId: activeConvId,
          title: convTitle,
          dbConnected: liveDbCtx.connected,
          memoryBackend,
        })
      }

      const child = spawn("python3", [scriptPath], {
        shell: false,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PATH: process.env.PATH || "/usr/bin:/bin",
          PYTHONUNBUFFERED: "1",
          GROQ_API_KEY: process.env.GROQ_API_KEY || "",
          GROQ_MODEL: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        },
      })

      let accumulatedReply = ""
      const recordedActions: Array<{
        id: string
        type: string
        titleAr: string
        titleEn: string
        dbPersisted?: boolean
      }> = []
      const recordedMemories: Array<{ key: string; value: string; category: string }> = []

      // Serialize async event processing so DB actions/memories finish BEFORE stream closes
      let eventChain = Promise.resolve()

      const processLine = (line: string) => {
        let ev: Record<string, unknown>
        try {
          ev = JSON.parse(line) as Record<string, unknown>
        } catch {
          return
        }

        const evType = ev.type
        if (evType === "token" && typeof ev.delta === "string") {
          accumulatedReply += ev.delta
          sendSseObj(ev)
          return
        }

        if (evType === "action" && ev.action) {
          eventChain = eventChain.then(async () => {
            const dbRes = verifiedStoreId
              ? await executeAssistantActionInSupabase(verifiedStoreId, ev.action)
              : { executed: false, dbPersisted: false }

            const actObj = ev.action as Record<string, unknown>
            recordedActions.push({
              id: `act-${Date.now()}-${recordedActions.length}`,
              type: String(actObj.type || "action"),
              titleAr: dbRes.detailAr || String(actObj.type || "إجراء متجر"),
              titleEn: dbRes.detailEn || String(actObj.type || "Store action"),
              dbPersisted: dbRes.dbPersisted,
            })

            sendSseObj({
              type: "action",
              action: ev.action,
              dbPersisted: dbRes.dbPersisted,
              dbDetailAr: dbRes.detailAr,
              dbDetailEn: dbRes.detailEn,
            })
          })
          return
        }

        if (evType === "memory" && ev.memory) {
          eventChain = eventChain.then(async () => {
            const validMem = assistantMemorySchema.safeParse(ev.memory)
            if (!validMem.success) return
            const saved = verifiedStoreId
              ? await upsertMemory(verifiedStoreId, auth.userId, validMem.data)
              : null
            recordedMemories.push({
              key: validMem.data.key,
              value: validMem.data.value,
              category: validMem.data.category,
            })
            sendSseObj({
              type: "memory",
              memory: {
                id: saved?.id,
                key: validMem.data.key,
                value: validMem.data.value,
                category: validMem.data.category,
              },
            })
          })
          return
        }

        if (evType === "done") {
          // Handled cleanly in child 'close' after all async DB ops finish
          return
        }

        sendSseObj(ev)
      }

      let stdoutBuf = ""
      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBuf += chunk.toString("utf-8")
        const lines = stdoutBuf.split("\n")
        stdoutBuf = lines.pop() ?? ""
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed) {
            processLine(trimmed)
          }
        }
      })

      child.stderr.on("data", (chunk: Buffer) => {
        console.error("[merchant-assistant python stderr]:", chunk.toString("utf-8"))
      })

      child.on("error", (err) => {
        console.error("[merchant-assistant spawn error]:", err)
        sendSseObj({
          type: "error",
          message: "تعذر تشغيل محرك بايثون للمساعد الذكي.",
        })
        sendSseObj({ type: "done" })
        safeClose()
      })

      child.on("close", () => {
        if (stdoutBuf.trim()) {
          processLine(stdoutBuf.trim())
        }
        eventChain
          .then(async () => {
            // Persist assistant reply into Supabase intra-chat history
            if (verifiedStoreId && activeConvId && accumulatedReply.trim()) {
              await appendConversationMessage(verifiedStoreId, activeConvId, {
                role: "assistant",
                content: accumulatedReply.trim(),
                actions: recordedActions,
                memoriesSaved: recordedMemories,
              })
              await touchConversation(verifiedStoreId, activeConvId, {
                summary: accumulatedReply.trim().slice(0, 240),
              })
            }
          })
          .catch((e) => {
            console.error("[merchant-assistant persist error]:", e)
          })
          .finally(() => {
            sendSseObj({ type: "done" })
            safeClose()
          })
      })

      req.signal.addEventListener("abort", () => {
        try {
          child.kill("SIGTERM")
        } catch {
          // Ignore
        }
        safeClose()
      })

      // Pass validated JSON safely through stdin (never via shell args)
      child.stdin.write(JSON.stringify(pythonPayload))
      child.stdin.end()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
