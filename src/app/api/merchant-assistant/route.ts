import { spawn } from "node:child_process"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionIdFromCookies } from "@/server/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  locale: z.enum(["ar", "en"]).default("ar"),
  storeContext: z.record(z.string(), z.unknown()).default({}),
})

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY?.trim() || ""
  const groqConfigured = Boolean(groqKey && !groqKey.startsWith("YOUR_"))
  return NextResponse.json({
    ok: true,
    runtime: "python3",
    provider: "groq",
    groqConfigured,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  })
}

export async function POST(req: NextRequest) {
  // Enforce authenticated merchant session (HttpOnly signed cookie)
  const sessionId = await getSessionIdFromCookies()
  if (!sessionId) {
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

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const child = spawn("python3", [scriptPath], {
        shell: false,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PATH: process.env.PATH || "/usr/bin:/bin",
          PYTHONUNBUFFERED: "1",
          GROQ_API_KEY: process.env.GROQ_API_KEY || "",
          GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        },
      })

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

      const sendSse = (jsonLine: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${jsonLine}\n\n`))
        } catch {
          safeClose()
        }
      }

      let stdoutBuf = ""
      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBuf += chunk.toString("utf-8")
        const lines = stdoutBuf.split("\n")
        stdoutBuf = lines.pop() ?? ""
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed) {
            sendSse(trimmed)
          }
        }
      })

      child.stderr.on("data", (chunk: Buffer) => {
        console.error("[merchant-assistant python stderr]:", chunk.toString("utf-8"))
      })

      child.on("error", (err) => {
        console.error("[merchant-assistant spawn error]:", err)
        sendSse(
          JSON.stringify({
            type: "error",
            message: "تعذر تشغيل محرك بايثون للمساعد الذكي.",
          })
        )
        sendSse(JSON.stringify({ type: "done" }))
        safeClose()
      })

      child.on("close", () => {
        if (stdoutBuf.trim()) {
          sendSse(stdoutBuf.trim())
        }
        safeClose()
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
      child.stdin.write(JSON.stringify(parsed.data))
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
