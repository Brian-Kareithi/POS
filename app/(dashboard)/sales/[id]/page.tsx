"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { ArrowLeft, Printer, RefreshCw, ShoppingCart, Receipt, User, CreditCard } from "lucide-react"

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { sales, customers, products, updateSale, addNotification } = useDataStore()
  const [showRefund, setShowRefund] = useState(false)

  const sale = sales.find((s) => s.id === params.id)
  const customer = customers.find((c) => c.id === sale?.customerId)

  const getProductName = (productId: string) =>
    products.find((p) => p.id === productId)?.name || "Item"

  if (!sale) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sale" description="Sale details">
          <Link href="/sales"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />Back to Sales</Button></Link>
        </PageHeader>
        <Card>
          <CardContent>
            <EmptyState icon={<Receipt className="h-12 w-12" />} title="Sale not found" description="This sale may have been deleted or the link is invalid." action={<Link href="/sales"><Button>View Sales</Button></Link>} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleRefund = () => {
    updateSale(sale.id, { status: "refunded" })
    addNotification({
      id: generateId(),
      userId: "",
      title: "Sale Refunded",
      message: `Sale ${sale.orderNumber} for ${formatCurrency(sale.total)} was refunded.`,
      type: "warning",
      read: false,
      createdAt: new Date().toISOString(),
    })
    setShowRefund(false)
  }

  const statusVariant = sale.status === "completed" ? "success" : sale.status === "refunded" ? "danger" : "default"

  return (
    <div className="space-y-6">
      <PageHeader title={`Sale ${sale.orderNumber}`} description={`Placed on ${formatDateTime(sale.createdAt)}`}>
        <Link href="/sales/new"><Button><ShoppingCart className="h-4 w-4" />New Sale</Button></Link>
        <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print Receipt</Button>
        {sale.status === "completed" && (
          <Button variant="danger" onClick={() => setShowRefund(true)}><RefreshCw className="h-4 w-4" />Refund</Button>
        )}
        <Button variant="secondary" onClick={() => router.push("/sales")}><ArrowLeft className="h-4 w-4" />Back</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Receipt className="h-4 w-4 text-gray-400" />Order Details</p>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Order #</span><span className="font-medium">{sale.orderNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><Badge variant={statusVariant}>{sale.status}</Badge></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span>{formatDateTime(sale.createdAt)}</span></div>
        </CardContent></Card>
        <Card><CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><User className="h-4 w-4 text-gray-400" />Customer</p>
          {customer ? (
            <Link href={`/customers/${customer.id}`} className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span><span className="font-medium text-blue-600 hover:text-blue-700">{customer.name}</span>
            </Link>
          ) : (
            <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium">Walk-in Customer</span></div>
          )}
          {customer && (
            <div className="flex justify-between text-sm"><span className="text-gray-500">Email</span><span>{customer.email}</span></div>
          )}
          {customer && (
            <div className="flex justify-between text-sm"><span className="text-gray-500">Points</span><span>{customer.loyaltyPoints}</span></div>
          )}
        </CardContent></Card>
        <Card><CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />Payment</p>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span><span className="capitalize font-medium">{sale.paymentMethod.replace("_", " ")}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Paid</span><span className="font-medium">{formatCurrency(sale.paidAmount)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Change</span><span>{formatCurrency(sale.changeAmount)}</span></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Items ({sale.items?.length || 0})</h3></CardHeader>
        <CardContent className="p-0">
          {sale.items && sale.items.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Price</TableHead><TableHead>Qty</TableHead><TableHead>Discount</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product?.name || getProductName(item.productId)}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.discount)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-gray-500 text-sm">No items recorded for this sale.</p>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-md ml-auto">
        <CardContent className="py-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{formatCurrency(sale.taxTotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-red-600">-{formatCurrency(sale.discountTotal)}</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(sale.total)}</span></div>
        </CardContent>
      </Card>

      <Dialog open={showRefund} onClose={() => setShowRefund(false)} title="Refund Sale" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Refund sale <span className="font-medium">{sale.orderNumber}</span> for <span className="font-medium">{formatCurrency(sale.total)}</span>? The sale will be marked as refunded.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowRefund(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleRefund}>Confirm Refund</Button>
        </div>
      </Dialog>
    </div>
  )
}
