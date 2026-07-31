"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { ArrowLeft, RefreshCw, DollarSign, Undo2 } from "lucide-react"

export default function SalesReturnsPage() {
  const router = useRouter()
  const { sales, updateSale, addNotification } = useDataStore()
  const [search, setSearch] = useState("")
  const [showRefund, setShowRefund] = useState<string | null>(null)

  const refunded = useMemo(() => sales.filter((s) => s.status === "refunded"), [sales])
  const refundable = useMemo(() => sales.filter((s) => s.status === "completed"), [sales])

  const filtered = useMemo(() => refunded.filter((s) =>
    s.orderNumber.toLowerCase().includes(search.toLowerCase())
  ), [refunded, search])

  const totalRefunded = refunded.reduce((sum, s) => sum + s.total, 0)

  const handleRefund = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    if (!sale) return
    updateSale(saleId, { status: "refunded" })
    addNotification({
      id: generateId(),
      userId: "",
      title: "Sale Refunded",
      message: `Sale ${sale.orderNumber} for ${formatCurrency(sale.total)} was refunded.`,
      type: "warning",
      read: false,
      createdAt: new Date().toISOString(),
    })
    setShowRefund(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Returns" description={`${refunded.length} refunded transactions`}>
        <Link href="/sales"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />Back to Sales</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Refunded" value={formatCurrency(totalRefunded)} icon={DollarSign} />
        <StatsCard title="Returns" value={refunded.length.toString()} icon={RefreshCw} />
        <StatsCard title="Refundable Sales" value={refundable.length.toString()} icon={Undo2} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search by order number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="p-0">
                <EmptyState icon={<RefreshCw className="h-12 w-12" />} title="No returns yet" description="Refund a completed sale to see it here." />
              </TableCell></TableRow>
            ) : filtered.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium"><Link href={`/sales/${sale.id}`} className="text-blue-600 hover:text-blue-700">{sale.orderNumber}</Link></TableCell>
                <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                <TableCell>{formatCurrency(sale.total)}</TableCell>
                <TableCell className="capitalize">{sale.paymentMethod.replace("_", " ")}</TableCell>
                <TableCell><Badge variant="danger">refunded</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(sale.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {refundable.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Process a Return</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {refundable.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sale.orderNumber}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(sale.total)} • {sale.customer?.name || "Walk-in"}</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => setShowRefund(sale.id)}>Refund</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!showRefund} onClose={() => setShowRefund(null)} title="Refund Sale" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Refund this sale for <span className="font-medium">{showRefund ? formatCurrency(sales.find((s) => s.id === showRefund)?.total || 0) : ""}</span>? This will mark the sale as refunded.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowRefund(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => showRefund && handleRefund(showRefund)}>Confirm Refund</Button>
        </div>
      </Dialog>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={() => router.push("/sales")}><ArrowLeft className="h-4 w-4" />Back to Sales</Button>
      </div>
    </div>
  )
}
