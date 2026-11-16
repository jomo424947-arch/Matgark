import { redirect } from "next/navigation"
import { getSessionIdFromCookies } from "@/server/auth/session"
import { withTransaction } from "@/server/db/client"
import type { Session, User, Store } from "@/types/domain"

export interface SessionContext {
  session: Session
  user: User
  store: Store
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const sessionId = await getSessionIdFromCookies()
  if (!sessionId) return null

  return withTransaction((db) => {
    const session = db.sessions.find(
      (s) => s.id === sessionId && s.expiresAt > Date.now()
    )
    if (!session) return null

    const user = db.users.find((u) => u.id === session.userId)
    if (!user) return null

    const store = db.stores.find((s) => s.id === session.storeId)
    if (!store) return null

    return { session, user, store }
  })
}

export async function requireSessionContext(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) {
    redirect("/login")
  }
  return ctx
}
