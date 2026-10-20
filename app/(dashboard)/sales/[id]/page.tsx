"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { refundSale } from "@/lib/services/checkout"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { ApprovalDialog } from "@/components/pos/approval-dialog"
import { ReceiptDialog } from "@/components/pos/receipt-dialog"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { ArrowLeft, Printer, RefreshCw, ShoppingCart, Receipt, User, CreditCard, Ban, WifiOff } from "lucide-react"

const refundReasons = ["Damaged item", "Wrong item", "Customer changed mind", "Expired product", "Pricing error"]
const voidReasons = ["Wrong item scanned", "Duplicate sale", "Customer left without paying", "Cashier error"]
const methodLabel = PAYMENT_METHOD_LABELS

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { sales, customers, products, users, branches } = useDataStore()
  const user = useAuthStore((s) => s.user)
  const [action, setAction] = useState<"refund" | "void" | null>(null)
  const [reprint, setReprint] = useState(false)

  const sale = sales.find((s) => s.id === params.id)
  const customer = customers.find((c) => c.id === sale?.customerId)
  const cashier = users.find((u) => u.id === sale?.userId)
  const branch = branches.find((b) => b.id === sale?.branchId)
  const getProductName = (productId: string) => products.find((p) => p.id === productId)?.name || "Item"

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

  const needsApproval = !can(user?.role, "refund.issue")
  const confirm = async ({ reason, approvalToken }: { reason: string; approvalToken?: string }) => {
    // Errors are shown inside the dialog, which stays open until the server accepts the change.
    await refundSale(sale.id, action ?? "refund", reason, approvalToken)
    setAction(null)
  }

  const statusVariant = sale.status === "completed" ? "success" : sale.status === "refunded" || sale.status === "cancelled" ? "danger" : "default"

  return (
    <div className="space-y-6">
      <PageHeader title={`Sale ${sale.receiptNumber ?? sale.orderNumber}`} description={`Placed on ${formatDateTime(sale.createdAt)}`}>
        {can(user?.role, "pos.sell") && <Link href="/"><Button><ShoppingCart className="h-4 w-4" />New Sale</Button></Link>}
        <Button variant="secondary" onClick={() => setReprint(true)}><Printer className="h-4 w-4" />Reprint receipt</Button>
        {sale.status === "completed" && (
          <>
            <Button variant="secondary" onClick={() => setAction("void")}><Ban className="h-4 w-4" />Void</Button>
            <Button variant="danger" onClick={() => setAction("refund")}><RefreshCw className="h-4 w-4" />Refund</Button>
          </>
        )}
        <Button variant="secondary" onClick={() => router.push("/sales")}><ArrowLeft className="h-4 w-4" />Back</Button>
      </PageHeader>

      {sale.synced === false && (
        <p className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700"><WifiOff className="h-4 w-4" />This sale was made offline and is waiting to sync.</p>
      )}
      {(sale.refundReason || sale.voidReason) && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {sale.status === "cancelled" ? "Voided" : "Refunded"}: {sale.refundReason ?? sale.voidReason}{sale.approvedBy ? ` · approved by ${sale.approvedBy}` : ""}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Receipt className="h-4 w-4 text-gray-400" />Order Details</p>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Receipt</span><span className="font-medium">{sale.receiptNumber ?? sale.orderNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><Badge variant={statusVariant}>{sale.status}</Badge></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Served by</span><span>{cashier?.name ?? "-"}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Branch</span><span>{branch?.name ?? "-"}</span></div>
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
          {customer && <div className="flex justify-between text-sm"><span className="text-gray-500">Phone</span><span>{customer.phone}</span></div>}
          {customer && <div className="flex justify-between text-sm"><span className="text-gray-500">Points</span><span>{customer.loyaltyPoints.toLocaleString()}{sale.loyaltyEarned ? ` (+${sale.loyaltyEarned} this sale)` : ""}</span></div>}
        </CardContent></Card>
        <Card><CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />Payment</p>
          {sale.payments?.map((p) => (
            <div key={p.id} className="flex justify-between text-sm"><span className="text-gray-500">{methodLabel[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span><span className="font-medium">{formatCurrency(p.amount)}</span></div>
          ))}
          {sale.changeAmount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Change given</span><span>{formatCurrency(sale.changeAmount)}</span></div>}
          {sale.amountDue ? <div className="flex justify-between text-sm"><span className="text-orange-600">Balance on account</span><span className="font-medium text-orange-600">{formatCurrency(sale.amountDue)}</span></div> : null}
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
          <div className="flex justify-between text-sm"><span className="text-gray-500">VAT included</span><span>{formatCurrency(sale.taxTotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Discount{sale.couponCode ? ` (${sale.couponCode})` : ""}</span><span className="text-red-600">-{formatCurrency(sale.discountTotal)}</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(sale.total)}</span></div>
        </CardContent>
      </Card>

      <ApprovalDialog
        open={action !== null}
        title={action === "void" ? "Void sale" : "Refund sale"}
        description={`${sale.receiptNumber ?? sale.orderNumber} · ${formatCurrency(sale.total)}. Stock goes back on the shelf and the action is written to the audit log.`}
        reasons={action === "void" ? voidReasons : refundReasons}
        needsApproval={needsApproval}
        confirmLabel={action === "void" ? "Void sale" : "Confirm refund"}
        onClose={() => setAction(null)}
        onConfirm={confirm}
      />
      <ReceiptDialog sale={reprint ? sale : null} reprint onClose={() => setReprint(false)} />
    </div>
  )
}
