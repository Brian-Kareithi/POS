"use client"

import { useEffect } from "react"
import { syncPendingSales } from "@/lib/services/checkout"

const BASE_MS = 20_000
const MAX_MS = 5 * 60_000

/**
 * Keeps trying to upload offline sales without anyone pressing a button: when the app opens, when the connection returns,
 * when the tab comes back into view, and on a timer that backs off (20 s, 40 s ... 5 min) while the server stays unreachable,
 * since "connected to Wi-Fi" does not always mean "can reach the internet".
 */
export function useOfflineSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let delay = BASE_MS

    const tick = async () => {
      const r = await syncPendingSales()
      delay = r.failedToReach ? Math.min(delay * 2, MAX_MS) : BASE_MS
      if (!stopped) timer = setTimeout(tick, delay)
    }
    const now = () => {
      if (timer) clearTimeout(timer)
      delay = BASE_MS
      void tick()
    }
    const visible = () => { if (document.visibilityState === "visible") now() }

    void tick()
    window.addEventListener("online", now)
    document.addEventListener("visibilitychange", visible)
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      window.removeEventListener("online", now)
      document.removeEventListener("visibilitychange", visible)
    }
  }, [enabled])
}
