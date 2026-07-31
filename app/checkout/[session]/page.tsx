"use client"

import { useState, use, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCheckoutStore } from "@/lib/stores/checkout-store"
import { useDataStore } from "@/lib/stores/data-store"
import { useCartStore } from "@/lib/stores/cart-store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/format"
import { generateId, generateOrderNumber } from "@/lib/utils/generators"
import { PAYMENT_METHODS } from "@/lib/constants"
import type { PaymentMethod } from "@/lib/types"
import { QrCode, ShoppingCart, CreditCard, CheckCircle, AlertCircle, Smartphone } from "lucide-react"

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const session = useCheckoutStore((s) => s.getSession(params.session as string))
  const completeSession = useCheckoutStore((s) => s.completeSession)
  const addSale = useDataStore((s) => s.addSale)
  const products = useDataStore((s) => s.products)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money")
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")
  const [now] = useState(() => Date.now())

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-sm text-gray-500 mb-6">This checkout session is invalid or has expired. Please ask the cashier to create a new checkout.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (session.status === "completed") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Paid</h2>
            <p className="text-sm text-gray-500">This order has already been completed.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (new Date(session.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-sm text-gray-500 mb-6">This QR code has expired. Please ask the cashier to generate a new one.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-500 mb-2">Your payment has been processed.</p>
            <p className="text-xs text-gray-400">Show this confirmation to the cashier.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePay = async () => {
    setProcessing(true)
    setError("")
    await new Promise((r) => setTimeout(r, 2000))
    const success = Math.random() > 0.1
    if (success) {
      const products_list = useDataStore.getState().products
      addSale({
        id: generateId(),
        businessId: "",
        branchId: "",
        userId: "",
        orderNumber: generateOrderNumber(),
        status: "completed",
        subtotal: session.total * 0.84,
        taxTotal: session.total * 0.08,
        discountTotal: session.total * 0.08,
        total: session.total,
        paidAmount: session.total,
        changeAmount: 0,
        paymentMethod,
        items: session.items.map((i) => ({
          id: generateId(), saleId: "", productId: i.productId,
          quantity: i.quantity, unitPrice: i.unitPrice, discount: 0, tax: i.total * 0.08, total: i.total,
        })),
        payments: [{ id: generateId(), saleId: "", method: paymentMethod, amount: session.total, status: "completed" as const, createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      })
      useDataStore.getState().addNotification({
        id: generateId(), userId: "", title: "New Payment Received",
        message: `Payment of ${formatCurrency(session.total)} via ${paymentMethod.replace("_", " ")} completed.`,
        type: "success", read: false, createdAt: new Date().toISOString(),
      })
      completeSession(session.token)
      setCompleted(true)
    } else {
      setError("Payment failed. Please try again.")
    }
    setProcessing(false)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white">Scan & Pay</h1>
          <p className="text-sm text-gray-400">Review your items and complete payment</p>
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
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(session.total)}</span>
            </div>

            <div className="space-y-3">
              <Select
                label="Payment Method"
                options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))}
                value={paymentMethod}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value as PaymentMethod)}
              />
              {paymentMethod === "mobile_money" && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                  <Smartphone className="h-4 w-4 inline mr-1" />
                  You will receive a payment request on your phone.
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button className="w-full" size="lg" onClick={handlePay} isLoading={processing}>
                <CreditCard className="h-5 w-5" />
                Pay {formatCurrency(session.total)}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Session expires in {Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - now) / 60000))} minutes
        </p>
      </div>
    </div>
  )
}
