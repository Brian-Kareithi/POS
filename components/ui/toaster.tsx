"use client"

import { useSyncExternalStore } from "react"
import { Toaster as Sonner } from "sonner"

const QUERY = "(max-width: 639px)"
const subscribe = (cb: () => void) => {
  const q = window.matchMedia?.(QUERY)
  q?.addEventListener("change", cb)
  return () => q?.removeEventListener("change", cb)
}
const isPhone = () => window.matchMedia?.(QUERY).matches ?? false

/** Toasts drop in at the top: centred on a phone, in the top-right corner on bigger screens. The look of each lives in lib/toast.tsx. */
export function Toaster() {
  const phone = useSyncExternalStore(subscribe, isPhone, () => false)
  return (
    <Sonner
      position={phone ? "top-center" : "top-right"}
      visibleToasts={3}
      offset={{ top: 16, right: 16 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      gap={8}
    />
  )
}
