"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { useDataStore } from "@/lib/stores/data-store"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { CheckCircle, Printer, Download, Home, Receipt } from "lucide-react"
import Link from "next/link"

export default function ReceiptPage() {
  const sales = useDataStore((s) => s.sales)
  const products = useDataStore((s) => s.products)
  const sale = sales.find((s) => s.status === "completed") || sales[0]
  const productName = (productId: string) => products.find((p) => p.id === productId)?.name || "Item"

  if (!sale) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm">
          <CardContent className="py-12 text-center space-y-4">
            <EmptyState icon={<Receipt className="h-12 w-12" />} title="No receipt available" description="Complete a payment to generate a receipt." />
            <Link href="/self-checkout"><Button className="w-full"><Home className="h-4 w-4" />Back to Start</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Receipt</h2>
            <p className="text-xs text-gray-400 mt-1">Order #{sale.orderNumber}</p>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm">
            {sale.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-500">{productName(item.productId)} x{item.quantity}</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
            ))}
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDateTime(sale.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{sale.paymentMethod.replace("_", " ")}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Amount Paid</span><span>{formatCurrency(sale.paidAmount)}</span></div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
            <Button variant="secondary" className="flex-1"><Download className="h-4 w-4" />Download</Button>
          </div>
          <Link href="/self-checkout"><Button className="w-full"><Home className="h-4 w-4" />Back to Start</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
