import { create } from "zustand"
import { generateId } from "@/lib/utils/generators"
import type { CheckoutSession, CheckoutSessionItem } from "@/lib/types"

interface CheckoutState {
  sessions: CheckoutSession[]
  createSession: (items: CheckoutSessionItem[], total: number) => CheckoutSession
  getSession: (token: string) => CheckoutSession | undefined
  completeSession: (token: string) => void
  expireSession: (token: string) => void
  cleanupExpired: () => void
}

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  sessions: [],

  createSession: (items, total) => {
    const session: CheckoutSession = {
      id: generateId(),
      saleId: "",
      token: generateId().replace(/-/g, "").substring(0, 12).toUpperCase(),
      items,
      total,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ sessions: [...s.sessions, session] }))
    return session
  },

  getSession: (token) => {
    return get().sessions.find((s) => s.token === token)
  },

  completeSession: (token) => {
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.token === token ? { ...sess, status: "completed" as const } : sess
      ),
    }))
  },

  expireSession: (token) => {
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.token === token ? { ...sess, status: "expired" as const } : sess
      ),
    }))
  },

  cleanupExpired: () => {
    set((s) => ({
      sessions: s.sessions.filter(
        (sess) => new Date(sess.expiresAt) > new Date() || sess.status === "completed"
      ),
    }))
  },
}))
