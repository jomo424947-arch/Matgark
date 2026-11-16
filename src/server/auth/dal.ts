import { redirect } from "next/navigation"
import { getSessionIdFromCookies } from "@/server/auth/session"
import { getSessionById, getUserById, getStoreById } from "@/server/db/client"
import type { Session, User, Store } from "@/types/domain"

export interface SessionContext {
  session: Session
  user: User
  store: Store
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const sessionId = await getSessionIdFromCookies()
  if (!sessionId) return null

  const session = await getSessionById(sessionId)
  if (!session) return null

  const user = await getUserById(session.userId)
  if (!user) return null

  const store = await getStoreById(session.storeId)
  if (!store) return null

  return { session, user, store }
}

export async function requireSessionContext(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) {
    redirect("/login")
  }
  return ctx
}
