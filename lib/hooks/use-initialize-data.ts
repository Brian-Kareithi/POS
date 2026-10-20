"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { loadAllData } from "@/lib/api/sync"

/** Re-reads the signed-in user (so role changes apply) and then loads all server data. Runs once per session start. */
export function useInitializeData(enabled: boolean) {
  const userId = useAuthStore((s) => s.user?.id)
  useEffect(() => {
    if (!enabled || !userId) return
    let cancelled = false
    ;(async () => {
      useDataStore.getState().setLoaded(false)
      // A token that the server no longer accepts ends the session here, and the shell sends the person to sign in.
      const valid = await useAuthStore.getState().validate()
      if (!cancelled && valid) await loadAllData()
    })()
    return () => { cancelled = true }
  }, [enabled, userId])
}

export const reloadData = () => loadAllData()
