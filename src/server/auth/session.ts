import crypto from "node:crypto"
import { cookies } from "next/headers"
import { createSession, deleteSession } from "@/server/db/client"
import { isSupabaseConfigured } from "@/server/db/supabase"
import type { Session } from "@/types/domain"

const COOKIE_NAME = "matgarak_session"
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

let warnedMissingSecret = false

function getSecret(): string {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production" && !warnedMissingSecret) {
    warnedMissingSecret = true
    console.warn("[Matgarak Security] SESSION_SECRET is not set in production environment.")
  }
  return (
    process.env.SESSION_SECRET ||
    "matgarak-default-dev-secret-key-replace-in-production-32chars"
  )
}

export function signSessionId(sessionId: string): string {
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(sessionId)
    .digest("hex")
  return `${sessionId}.${sig}`
}

export function verifySessionToken(token: string): string | null {
  if (!token || !token.includes(".")) return null
  const [sessionId, providedSig] = token.split(".")
  if (!sessionId || !providedSig) return null

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(sessionId)
    .digest("hex")

  const expectedBuf = Buffer.from(expectedSig, "hex")
  const providedBuf = Buffer.from(providedSig, "hex")

  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return null
  }

  return sessionId
}

export async function createSessionCookie(
  userId: string,
  storeId: string
): Promise<string> {
  const sessionId = `sess-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`
  const expiresAt = Date.now() + THIRTY_DAYS_MS

  const session: Session = {
    id: sessionId,
    userId,
    storeId,
    expiresAt,
  }

  if (isSupabaseConfigured) {
    await createSession(session)
  }

  const signedToken = signSessionId(sessionId)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })

  return signedToken
}

export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token && isSupabaseConfigured) {
    const sessionId = verifySessionToken(token)
    if (sessionId) {
      await deleteSession(sessionId).catch(() => {})
    }
  }

  cookieStore.delete(COOKIE_NAME)
}

const ADMIN_COOKIE_NAME = "matgarak_admin_session"

export async function createAdminSessionCookie(adminId: string): Promise<string> {
  const sessionId = `admin-${adminId}-${Date.now()}-${crypto.randomBytes(12).toString("hex")}`
  const signedToken = signSessionId(sessionId)
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
  return signedToken
}

export async function destroyAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

export async function getAdminSessionIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function getSessionIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}
