"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/stores/cart-store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils/format"
import { PAYMENT_METHODS } from "@/lib/constants"
import type { PaymentMethod } from "@/lib/types"
import { CreditCard, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const router = useRouter()
  const cart = useCartStore()
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(cart.paymentMethod)

  const handlePay = async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setProcessing(false)
    setCompleted(true)
    cart.clearCart()
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-500 mb-6">Your digital receipt has been generated.</p>
            <Link href="/self-checkout/receipt"><Button>View Receipt</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/self-checkout/cart" className="text-sm text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4 inline" /> Back</Link>
        <h1 className="text-lg font-semibold text-gray-900">Payment</h1>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Order Summary</h3></CardHeader>
          <CardContent className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
              <span>Total</span><span>{formatCurrency(cart.getTotal())}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <Select label="Payment Method" options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))} value={paymentMethod} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const method = e.target.value as PaymentMethod; setPaymentMethod(method); cart.setPaymentMethod(method) }} />
            <Button className="w-full" size="lg" onClick={handlePay} isLoading={processing} disabled={cart.items.length === 0}>
              <CreditCard className="h-5 w-5" />Pay {formatCurrency(cart.getTotal())}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
