"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QRCode } from "@/components/ui/qr-code"
import { useCartStore } from "@/lib/stores/cart-store"
import { useCheckoutStore } from "@/lib/stores/checkout-store"
import { ShoppingCart, Scan, CreditCard } from "lucide-react"

export default function SelfCheckoutPage() {
  const cart = useCartStore()
  const sessions = useCheckoutStore((s) => s.sessions)
  const items = cart.items

  useEffect(() => {
    useCheckoutStore.getState().cleanupExpired()
    const cartState = useCartStore.getState()
    if (cartState.items.length === 0) return
    const total = cartState.getTotal()
    const count = cartState.items.length
    const hasPending = useCheckoutStore
      .getState()
      .sessions.some((s) => s.status === "pending" && Math.abs(s.total - total) < 0.01 && s.items.length === count)
    if (!hasPending) {
      useCheckoutStore.getState().createSession(cartState.getCheckoutItems(), total)
    }
  }, [items])

  const session = useMemo(() => {
    const total = useCartStore.getState().getTotal()
    const count = items.length
    return (
      sessions.find((s) => s.status === "pending" && Math.abs(s.total - total) < 0.01 && s.items.length === count) ||
      null
    )
  }, [sessions, items])

  const checkoutUrl = useMemo(() => {
    if (!session) return ""
    const payload = encodeURIComponent(
      JSON.stringify({
        items: session.items,
        total: session.total,
        expiresAt: session.expiresAt,
      })
    )
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/checkout/${session.token}?payload=${payload}`
  }, [session])

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Self Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Scan, pay, and go</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            {checkoutUrl ? (
              <>
                <div className="mx-auto mb-6 w-48 h-48 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200">
                  <QRCode value={checkoutUrl} size={176} />
                </div>
                <p className="text-sm text-gray-500 mb-1">Scan this QR code with your phone to pay</p>
                <p className="text-xs text-gray-400">Session: {session?.token}</p>
              </>
            ) : (
              <div className="py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500 mb-1">Your cart is empty</p>
                <p className="text-xs text-gray-400 mb-4">Add items to generate a payment QR code</p>
                <Link href="/self-checkout/scan"><Button variant="secondary">Add Items</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/self-checkout/scan">
            <Card className="hover:border-gray-300 cursor-pointer">
              <CardContent className="p-4 text-center">
                <Scan className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-900">Scan Items</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/self-checkout/cart">
            <Card className="hover:border-gray-300 cursor-pointer">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-900">View Cart</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Link href="/self-checkout/payment">
          <Button className="w-full" size="lg" disabled={items.length === 0}>
            <CreditCard className="h-5 w-5" />Proceed to Payment
          </Button>
        </Link>
      </div>
    </div>
  )
}
