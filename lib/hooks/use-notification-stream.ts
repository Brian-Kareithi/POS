"use client"

import { useEffect } from "react"
import { API_BASE, api } from "@/lib/api/client"
import { toNotification } from "@/lib/api/mappers"
import { refresh } from "@/lib/api/sync"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { notify } from "@/lib/toast"

/** Live notifications over Server-Sent Events. EventSource cannot set headers, so the token goes in the query string. */
export function useNotificationStream(enabled: boolean) {
  const userId = useAuthStore((s) => s.user?.id)
  useEffect(() => {
    if (!enabled || !userId || typeof EventSource === "undefined") return
    let source: EventSource | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const connect = () => {
      const token = useAuthStore.getState().token
      if (!token || stopped) return
      source = new EventSource(`${API_BASE}/notifications/stream?access_token=${encodeURIComponent(token)}`)
      source.addEventListener("notification", (e) => {
        const n = toNotification(JSON.parse((e as MessageEvent).data))
        useDataStore.getState().upsert("notifications", n, true)
        notify.info(n.title, n.message)
        // A new access request changes the staff list the owner is looking at.
        if (n.link === "/employees") void refresh.staff().catch(() => {})
      })
      source.onerror = () => {
        source?.close()
        // The access token lasts 15 minutes. Any API call refreshes it, then we reconnect with the new one.
        retry = setTimeout(async () => {
          try { await api("/auth/me") } catch { /* signed out */ }
          connect()
        }, 5000)
      }
    }
    connect()
    return () => { stopped = true; clearTimeout(retry); source?.close() }
  }, [enabled, userId])
}
