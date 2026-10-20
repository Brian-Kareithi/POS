"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/stores/cart-store"
import { useCheckoutStore } from "@/lib/stores/checkout-store"
import { useKioskSession } from "@/lib/hooks/use-kiosk-session"
import { selfCheckout } from "@/lib/api/self-checkout"
import { errorMessage } from "@/lib/api/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils/format"
import { Smartphone, ArrowLeft } from "lucide-react"

export default function PaymentPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const { session, error: sessionError } = useKioskSession()
  const [phone, setPhone] = useState("")
  const [stage, setStage] = useState<"idle" | "sending" | "waiting">("idle")
  const [error, setError] = useState("")

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    if (!/^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""))) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.")
    setError("")
    setStage("sending")
    try {
      await selfCheckout.pay(session.token, phone.replace(/\s/g, ""))
      setStage("waiting")
    } catch (err) {
      setStage("idle")
      setError(errorMessage(err, "Could not send the M-Pesa request."))
    }
  }

  // The server creates the sale once M-Pesa confirms; keep asking until it does.
  const token = session?.token
  useEffect(() => {
    if (stage !== "waiting" || !token) return
    const timer = setInterval(async () => {
      try {
        const s = await selfCheckout.get(token)
        if (s.status === "completed") {
          useCheckoutStore.getState().setSession(s)
          useCartStore.getState().clearCart()
          router.push("/self-checkout/receipt")
        } else if (s.payment?.status === "failed") {
          setStage("idle")
          setError(s.payment.message || "The M-Pesa payment did not go through. Try again.")
        } else if (s.status === "expired") {
          setStage("idle")
          setError("This checkout expired. Go back and start again.")
        }
      } catch { /* try again */ }
    }, 3000)
    return () => clearInterval(timer)
  }, [stage, token, router])

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/self-checkout/cart" className="text-sm text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4 inline" /> Back</Link>
        <h1 className="text-lg font-semibold text-gray-900">Payment</h1>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Order Summary</h3></CardHeader>
          <CardContent className="space-y-2">
            {!session ? (
              <p className="text-sm text-gray-500" role={sessionError ? "alert" : "status"}>{items.length === 0 ? "Your cart is empty." : sessionError || "Getting your total…"}</p>
            ) : (
              <>
                {session.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                  <span>Total (VAT included)</span><span>{formatCurrency(session.total)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <form onSubmit={pay} className="space-y-4">
              <Input label="M-Pesa phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={stage !== "idle"} />
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              {stage === "waiting" && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">Check your phone and enter your M-Pesa PIN. This page updates by itself.</p>}
              <Button type="submit" className="w-full" size="lg" isLoading={stage === "sending"} disabled={!session || stage !== "idle"}>
                <Smartphone className="h-5 w-5" />Pay {session ? formatCurrency(session.total) : ""} with M-Pesa
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
