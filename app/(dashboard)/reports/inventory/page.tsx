"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { inRange, productStats } from "@/lib/utils/analytics"
import { getBranchStock, getStock, expiryStatus, daysToExpiry } from "@/lib/utils/stock"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { AlertTriangle, CalendarClock, DollarSign, Trash2 } from "lucide-react"

export default function InventoryReportsPage() {
  const now = useNow()
  const allProducts = useDataStore((s) => s.products)
  const categories = useDataStore((s) => s.categories)
  const branches = useDataStore((s) => s.branches)
  const adjustments = useDataStore((s) => s.stockAdjustments)
  const { sales, branchId, label: branchLabel } = useBranchFilter()
  const state = useReportRange("30d")

  const ids = branches.map((b) => b.id)
  const products = useMemo(() => allProducts.filter((p) => p.isActive), [allProducts])
  const units = (p: (typeof products)[number]) => (branchId === "all" ? getStock(p) : getBranchStock(p, branchId, ids))

  const view = useMemo(() => {
    const value = products.reduce((s, p) => s + p.costPrice * units(p), 0)
    const retail = products.reduce((s, p) => s + p.sellingPrice * units(p), 0)
    const low = products.filter((p) => units(p) <= p.minStock / (branchId === "all" ? 1 : 2))
    const expiring = products.filter((p) => ["soon", "expired"].includes(expiryStatus(p))).sort((a, b) => (daysToExpiry(a) ?? 0) - (daysToExpiry(b) ?? 0))
    const sold = new Map(productStats(sales.filter((s) => inRange(s.createdAt, { start: new Date(now - 60 * 86400000), end: new Date() })), products).map((s) => [s.product.id, s.quantity]))
    const dead = products.filter((p) => (sold.get(p.id) ?? 0) === 0 && units(p) > 0)
    const byCategory = categories.map((c) => {
      const list = products.filter((p) => p.categoryId === c.id)
      return { name: c.name, items: list.length, units: list.reduce((s, p) => s + units(p), 0), value: list.reduce((s, p) => s + p.costPrice * units(p), 0) }
    }).filter((c) => c.items > 0)
    const losses = adjustments.filter((a) => a.change < 0 && inRange(a.createdAt, state.range))
    const lossValue = losses.reduce((s, a) => s + Math.abs(a.change) * (allProducts.find((p) => p.id === a.productId)?.costPrice ?? 0), 0)
    return { value, retail, low, expiring, dead, byCategory, losses, lossValue }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, adjustments, sales, state.range, branchId, now])

  const rows = () => products.map((p) => ({ Product: p.name, SKU: p.sku, Barcode: p.barcode, Units: units(p), "Cost value": units(p) * p.costPrice, "Retail value": units(p) * p.sellingPrice, Expiry: p.expiryDate?.slice(0, 10) ?? "", Batch: p.batchNumber ?? "" }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="Inventory Report" description="Stock value, low stock, expiry, dead stock and write-offs" />
      <ReportToolbar state={state} branchLabel={branchLabel} rows={rows} filename="inventory-report" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Stock value (cost)" value={formatCurrency(view.value)} icon={DollarSign} change={`${formatCurrency(view.retail)} at retail`} />
        <StatsCard title="Low stock items" value={view.low.length.toString()} icon={AlertTriangle} changeType={view.low.length ? "negative" : "positive"} />
        <StatsCard title="Expiring / expired" value={view.expiring.length.toString()} icon={CalendarClock} changeType={view.expiring.length ? "negative" : "positive"} />
        <StatsCard title="Write-offs in period" value={formatCurrency(view.lossValue)} icon={Trash2} change={`${view.losses.length} adjustments`} changeType={view.losses.length ? "negative" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Value by category</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Products</TableHead><TableHead>Units</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
              <TableBody>{view.byCategory.map((c) => <TableRow key={c.name}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.items}</TableCell><TableCell>{c.units}</TableCell><TableCell>{formatCurrency(c.value)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Expiry watch</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Batch</TableHead><TableHead>Units</TableHead><TableHead>Expires</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.expiring.map((p) => { const d = daysToExpiry(p) ?? 0; return <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell className="font-mono text-xs text-gray-500">{p.batchNumber}</TableCell><TableCell>{units(p)}</TableCell><TableCell><Badge variant={d < 0 ? "danger" : "warning"}>{d < 0 ? "Expired" : `${d} days`}</Badge></TableCell></TableRow> })}
                {view.expiring.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">Nothing is close to expiring.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Low stock</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Units</TableHead><TableHead>Reorder level</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.low.map((p) => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell><Badge variant={units(p) === 0 ? "danger" : "warning"}>{units(p)}</Badge></TableCell><TableCell>{p.minStock}</TableCell></TableRow>)}
                {view.low.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-gray-500">Everything is above its reorder level.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Dead stock (no sales in 60 days)</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Units</TableHead><TableHead>Cash tied up</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.dead.map((p) => <TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{units(p)}</TableCell><TableCell>{formatCurrency(units(p) * p.costPrice)}</TableCell></TableRow>)}
                {view.dead.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-gray-500">Every product has sold recently.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Damaged, expired and missing goods</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Units lost</TableHead><TableHead>Reason</TableHead><TableHead>Recorded by</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {view.losses.map((a) => <TableRow key={a.id}><TableCell className="font-medium">{a.productName}</TableCell><TableCell><Badge variant="danger">{a.change}</Badge></TableCell><TableCell>{a.reason}</TableCell><TableCell>{a.userName}</TableCell><TableCell className="text-gray-500">{formatDateTime(a.createdAt)}</TableCell></TableRow>)}
              {view.losses.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-gray-500">No write-offs in this period.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
