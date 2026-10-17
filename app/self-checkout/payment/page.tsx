"use client"

import { useState } from "react"
import { useCartStore } from "@/lib/stores/cart-store"
import { useCheckoutStore } from "@/lib/stores/checkout-store"
import { useDataStore } from "@/lib/stores/data-store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils/format"
import { generateId, generateOrderNumber } from "@/lib/utils/generators"
import { PAYMENT_METHODS } from "@/lib/constants"
import type { PaymentMethod } from "@/lib/types"
import { CreditCard, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PaymentPage() {
  const cart = useCartStore()
  const addSale = useDataStore((s) => s.addSale)
  const addNotification = useDataStore((s) => s.addNotification)
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(cart.paymentMethod)

  const subtotal = cart.getSubtotal()
  const taxTotal = cart.getTaxTotal()
  const discountTotal = cart.getDiscountTotal()
  const total = cart.getTotal()

  const handlePay = async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setProcessing(false)

    const sale = {
      id: generateId(),
      businessId: "",
      branchId: "",
      customerId: cart.customerId,
      userId: "",
      receiptNumber: `RCP-SC-${Math.floor(Math.random() * 90000 + 10000)}`,
      synced: true,
      orderNumber: generateOrderNumber(),
      status: "completed" as const,
      subtotal,
      taxTotal,
      discountTotal,
      total,
      paidAmount: total,
      changeAmount: 0,
      paymentMethod,
      notes: cart.notes,
      items: cart.items.map((i) => ({
        id: generateId(),
        saleId: "",
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        tax: i.tax,
        total: i.total,
      })),
      payments: [{
        id: generateId(),
        saleId: "",
        method: paymentMethod,
        amount: total,
        status: "completed" as const,
        createdAt: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
    }
    addSale(sale)
    sale.items.forEach((i) => useDataStore.getState().adjustStock(i.productId, -i.quantity))
    addNotification({
      id: generateId(),
      userId: "",
      title: "New Self-Checkout Sale",
      message: `Sale ${sale.orderNumber} for ${formatCurrency(total)} completed.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    })
    useCheckoutStore.getState().sessions
      .filter((s) => s.status === "pending")
      .forEach((s) => useCheckoutStore.getState().completeSession(s.token))
    cart.clearCart()
    setCompleted(true)
  }

  if (completed) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-sm text-gray-500 mb-6">Your receipt has been generated.</p>
            <Link href="/self-checkout/receipt"><Button>View Receipt</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span><span>{formatCurrency(taxTotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span><span className="text-red-600">-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <Select label="Payment Method" options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))} value={paymentMethod} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const method = e.target.value as PaymentMethod; setPaymentMethod(method); cart.setPaymentMethod(method) }} />
            <Input label="Amount Paid" type="number" step="0.01" value={total.toFixed(2)} readOnly />
            <Button className="w-full" size="lg" onClick={handlePay} isLoading={processing} disabled={cart.items.length === 0}>
              <CreditCard className="h-5 w-5" />Pay {formatCurrency(total)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}