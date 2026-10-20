import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "@/lib/api/client"
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

/** What is saved on the server for a held sale. Lines keep only ids, so prices and stock are always re-read when resuming. */
interface HeldCart {
  lines: { productId: string; quantity: number }[]
  customerId?: string
  discountKind: "percent" | "amount"
  discountValue: number
  couponCode: string
  heldBy: string
}

export interface QueuedSale {
  idempotencyKey: string
  occurredAt: string
  payload: Record<string, unknown>
}

interface PosState {
  held: HeldSale[]
  /** Sales rung up while the network was down, waiting to be uploaded with POST /sales/sync. */
  queue: QueuedSale[]
  /** Forces offline behaviour for testing; the browser's own online/offline state is always honoured too. */
  offlineMode: boolean
  loadHeld: (products: Product[]) => Promise<void>
  hold: (sale: Omit<HeldSale, "id" | "heldAt">) => Promise<void>
  resume: (id: string) => Promise<void>
  discardHeld: (id: string) => Promise<void>
  enqueue: (sale: QueuedSale) => void
  dequeue: (keys: string[]) => void
  setOfflineMode: (offline: boolean) => void
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      held: [],
      queue: [],
      offlineMode: false,
      loadHeld: async (products) => {
        const rows = await api<{ id: string; label: string | null; cart: HeldCart; createdAt: string }[]>("/held-sales")
        set({
          held: rows.map((r) => ({
            id: r.id,
            label: r.label ?? "Held sale",
            customerId: r.cart.customerId,
            lines: r.cart.lines.flatMap((l) => {
              const product = products.find((p) => p.id === l.productId)
              return product ? [{ product, quantity: l.quantity }] : []
            }),
            discountKind: r.cart.discountKind,
            discountValue: r.cart.discountValue,
            couponCode: r.cart.couponCode,
            heldAt: r.createdAt,
            heldBy: r.cart.heldBy,
          })),
        })
      },
      hold: async (sale) => {
        const cart: HeldCart = {
          lines: sale.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          customerId: sale.customerId,
          discountKind: sale.discountKind,
          discountValue: sale.discountValue,
          couponCode: sale.couponCode,
          heldBy: sale.heldBy,
        }
        const row = await api<{ id: string; createdAt: string }>("/held-sales", { method: "POST", body: { label: sale.label, cart } })
        set((s) => ({ held: [{ ...sale, id: row.id, heldAt: row.createdAt }, ...s.held] }))
      },
      resume: async (id) => {
        await api(`/held-sales/${id}`, { method: "DELETE" })
        set((s) => ({ held: s.held.filter((h) => h.id !== id) }))
      },
      discardHeld: async (id) => {
        await api(`/held-sales/${id}`, { method: "DELETE" })
        set((s) => ({ held: s.held.filter((h) => h.id !== id) }))
      },
      enqueue: (sale) => set((s) => ({ queue: [...s.queue, sale] })),
      dequeue: (keys) => set((s) => ({ queue: s.queue.filter((q) => !keys.includes(q.idempotencyKey)) })),
      setOfflineMode: (offlineMode) => set({ offlineMode }),
    }),
    {
      name: "pos-session",
      version: 2,
      // Only the offline queue must survive a reload; held sales live on the server.
      partialize: (s) => ({ queue: s.queue }),
      migrate: () => ({ queue: [] }) as never,
    }
  )
)

export const isOffline = () =>
  usePosStore.getState().offlineMode || (typeof navigator !== "undefined" && navigator.onLine === false)
