import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/lib/types"

export interface HeldSale {
  id: string
  label: string
  customerId?: string
  lines: { product: Product; quantity: number }[]
  discountKind: "percent" | "amount"
  discountValue: number
  couponCode: string
  heldAt: string
  heldBy: string
}

interface PosState {
  held: HeldSale[]
  /** Simulates an internet outage so the offline queue can be demoed. */
  offlineMode: boolean
  hold: (sale: HeldSale) => void
  resume: (id: string) => void
  discardHeld: (id: string) => void
  setOfflineMode: (offline: boolean) => void
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      held: [],
      offlineMode: false,
      hold: (sale) => set((s) => ({ held: [sale, ...s.held] })),
      resume: (id) => set((s) => ({ held: s.held.filter((h) => h.id !== id) })),
      discardHeld: (id) => set((s) => ({ held: s.held.filter((h) => h.id !== id) })),
      setOfflineMode: (offlineMode) => set({ offlineMode }),
    }),
    { name: "pos-session", version: 1 }
  )
)

export const isOffline = () =>
  usePosStore.getState().offlineMode || (typeof navigator !== "undefined" && navigator.onLine === false)
