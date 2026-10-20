"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { formatCurrency } from "@/lib/utils/format"
import { selfCheckout, type PublicSession } from "@/lib/api/self-checkout"
import { ApiError, errorMessage } from "@/lib/api/client"
import { CheckCircle, AlertCircle, Smartphone } from "lucide-react"

function Notice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-black flex items-center justify-center px-4">
      <ThemeToggle className="fixed right-3 top-3 z-30" />
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12">
          <div className="mx-auto mb-4 flex justify-center">{icon}</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500">{text}</p>
        </CardContent>
      </Card>
    </div>
  )
}

/** The page a shopper opens from the kiosk QR code. It is public: the server holds the cart and does all the pricing. */
export default function CheckoutPage() {
  const token = useParams().session as string
  const [session, setSession] = useState<PublicSession | null>(null)
  const [missing, setMissing] = useState(false)
  const [phone, setPhone] = useState("")
  const [stage, setStage] = useState<"idle" | "sending" | "waiting">("idle")
  const [error, setError] = useState("")
  const [now, setNow] = useState(() => Date.now())

  // Load once, then keep checking while the shopper pays so the page turns green by itself.
  useEffect(() => {
    let stopped = false
    const load = async () => {
      try {
        const s = await selfCheckout.get(token)
        if (stopped) return
        setSession(s)
        if (s.payment?.status === "failed" && stage === "waiting") {
          setStage("idle")
          setError(s.payment.message || "The M-Pesa payment did not go through. Try again.")
        }
      } catch (e) {
        if (!stopped && e instanceof ApiError && e.status === 404) setMissing(true)
      }
    }
    void load()
    const poll = setInterval(() => { if (stage === "waiting") void load() }, 3000)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => { stopped = true; clearInterval(poll); clearInterval(tick) }
  }, [token, stage])

  if (missing) return <Notice icon={<AlertCircle className="h-12 w-12 text-red-500" />} title="Checkout not found" text="This checkout link is invalid. Please ask for a new QR code." />
  if (!session) return <Notice icon={<Smartphone className="h-12 w-12 text-gray-300" />} title="Loading your order…" text="One moment." />
  if (session.status === "completed") {
    return (
      <Notice
        icon={<div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-8 w-8 text-green-600" /></div>}
        title="Payment successful!"
        text={`${session.receipt ? `Receipt ${session.receipt.receiptNumber}. ` : ""}Show this confirmation if asked.`}
      />
    )
  }
  if (session.status === "expired") return <Notice icon={<AlertCircle className="h-12 w-12 text-orange-500" />} title="Checkout expired" text="This QR code has expired. Please scan a new one at the till." />

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""))) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.")
    setError("")
    setStage("sending")
    try {
      await selfCheckout.pay(token, phone.replace(/\s/g, ""))
      setStage("waiting")
    } catch (err) {
      setStage("idle")
      setError(errorMessage(err, "Could not send the M-Pesa request."))
    }
  }

  const minutes = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now) / 60000))

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-black flex flex-col items-center px-4 py-8">
      <ThemeToggle className="fixed right-3 top-3 z-30" />
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Scan & Pay</h1>
          <p className="text-sm text-gray-500">Review your items and pay with M-Pesa</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Your Items</h3>
              <Badge>{session.items.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-gray-100">
            {session.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">x{item.quantity} @ {formatCurrency(item.unitPrice)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 ml-4">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span className="text-gray-900">Total (VAT included)</span>
              <span className="text-gray-900">{formatCurrency(session.total)}</span>
            </div>
            <form onSubmit={pay} className="space-y-3">
              <Input label="M-Pesa phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={stage !== "idle"} />
              {error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
              {stage === "waiting" && <div role="status" className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800"><Smartphone className="h-4 w-4 inline mr-1" />Check your phone and enter your M-Pesa PIN. This page updates by itself.</div>}
              <Button type="submit" className="w-full" size="lg" isLoading={stage === "sending"} disabled={stage !== "idle"}>
                <Smartphone className="h-5 w-5" />Pay {formatCurrency(session.total)}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">This checkout expires in {minutes} minute{minutes === 1 ? "" : "s"}</p>
      </div>
    </div>
  )
}
