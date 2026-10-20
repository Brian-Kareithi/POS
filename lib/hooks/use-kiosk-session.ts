"use client"

import { useEffect, useRef, useState } from "react"
import { useCartStore } from "@/lib/stores/cart-store"
import { useCheckoutStore } from "@/lib/stores/checkout-store"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { selfCheckout } from "@/lib/api/self-checkout"
import { errorMessage } from "@/lib/api/client"

/** Starts (or restarts, when the cart changes) a server-side checkout session for the current cart. */
export function useKioskSession() {
  const items = useCartStore((s) => s.items)
  const session = useCheckoutStore((s) => s.session)
  const business = useDataStore((s) => s.business)
  const branches = useDataStore((s) => s.branches)
  const user = useAuthStore((s) => s.user)
  const [error, setError] = useState("")
  const signature = items.map((i) => `${i.productId}:${i.quantity}`).join(",")
  const lastSig = useRef<string | null>(null)
  const branchId = user?.branchId ?? branches[0]?.id

  useEffect(() => {
    if (items.length === 0) {
      lastSig.current = null
      useCheckoutStore.getState().setSession(null)
      return
    }
    if (lastSig.current === signature || !business?.slug) return
    lastSig.current = signature
    if (!branchId) return
    let cancelled = false
    selfCheckout
      .create({ businessSlug: business.slug, branchId, lines: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) })
      .then((s) => { if (!cancelled) { setError(""); useCheckoutStore.getState().setSession(s) } })
      .catch((e) => { if (!cancelled) { lastSig.current = null; useCheckoutStore.getState().setSession(null); setError(errorMessage(e, "Could not start checkout.")) } })
    return () => { cancelled = true }
  }, [signature, business?.slug, branchId, items])

  return {
    session: items.length ? session : null,
    error: !branchId ? "This device has no branch to sell from." : error,
    creating: items.length > 0 && !session && !error,
  }
}
