"use client"

import { useSyncExternalStore } from "react"
import { usePosStore } from "@/lib/stores/pos-store"

function subscribe(cb: () => void) {
  window.addEventListener("online", cb)
  window.addEventListener("offline", cb)
  return () => {
    window.removeEventListener("online", cb)
    window.removeEventListener("offline", cb)
  }
}

/** True when the browser has a connection and the test switch is off. A till on a flaky line may still fail requests; selling handles that separately. */
export function useOnline(): boolean {
  const browser = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  const forcedOffline = usePosStore((s) => s.offlineMode)
  return browser && !forcedOffline
}
