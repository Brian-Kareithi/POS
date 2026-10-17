"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useMemo } from "react"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getStock } from "@/lib/utils/stock"
import { summarize } from "@/lib/utils/analytics"
import { formatCurrency } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import type { PurchaseOrder } from "@/lib/types"
import { AlertTriangle, CalendarDays, Clock, Sparkles, TrendingUp } from "lucide-react"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const COVER_DAYS = 21

export default function InsightsPage() {
  const now = useNow()
  const { products, sales, suppliers, warehouses, purchaseOrders, addPurchaseOrder, logAudit } = useDataStore()
  const user = useAuthStore((s) => s.user)

  const view = useMemo(() => {
    const completed = sales.filter((s) => s.status === "completed")
    const recent = completed.filter((s) => now - new Date(s.createdAt).getTime() <= 30 * 86400000)

    const sold = new Map<string, number>()
    recent.forEach((s) => s.items?.forEach((i) => sold.set(i.productId, (sold.get(i.productId) ?? 0) + i.quantity)))
    const forecast = products.filter((p) => p.isActive).map((p) => {
      const velocity = (sold.get(p.id) ?? 0) / 30
      const stock = getStock(p)
      const daysLeft = velocity > 0 ? stock / velocity : Infinity
      const target = Math.ceil(velocity * COVER_DAYS)
      const suggest = Math.max(0, target - stock)
      return { product: p, velocity, stock, daysLeft, suggest: Math.ceil(suggest / 12) * 12 }
    })
    const reorder = forecast.filter((f) => f.suggest > 0 && f.daysLeft <= 14).sort((a, b) => a.daysLeft - b.daysLeft)
    const slow = forecast.filter((f) => f.velocity < 0.2 && f.stock > 0)
    const tiedUp = slow.reduce((s, f) => s + f.stock * f.product.costPrice, 0)

    const byDay = DAYS.map((label) => ({ label, total: 0, days: new Set<string>() }))
    const byHour = new Map<number, number>()
    completed.filter((s) => now - new Date(s.createdAt).getTime() <= 56 * 86400000).forEach((s) => {
      const d = new Date(s.createdAt)
      byDay[d.getDay()].total += s.subtotal - s.discountTotal
      byDay[d.getDay()].days.add(d.toDateString())
      byHour.set(d.getHours(), (byHour.get(d.getHours()) ?? 0) + 1)
    })
    const weekday = byDay.map((d) => ({ label: d.label, average: d.days.size ? Math.round(d.total / d.days.size) : 0 }))
    const peakHour = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const bestDay = [...weekday].sort((a, b) => b.average - a.average)[0]

    // Next 7 days: average of the same weekday over the last 8 weeks.
    const next7 = Array.from({ length: 7 }, (_, i) => weekday[new Date(now + (i + 1) * 86400000).getDay()].average).reduce((a, b) => a + b, 0)
    const last7 = summarize(completed.filter((s) => now - new Date(s.createdAt).getTime() <= 7 * 86400000), products).net

    const pairs = new Map<string, number>()
    recent.forEach((s) => {
      const ids = [...new Set(s.items?.map((i) => i.productId))].sort()
      for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) pairs.set(`${ids[a]}|${ids[b]}`, (pairs.get(`${ids[a]}|${ids[b]}`) ?? 0) + 1)
    })
    const together = [...pairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, count]) => {
      const [x, y] = key.split("|")
      return { a: products.find((p) => p.id === x)?.name ?? "?", b: products.find((p) => p.id === y)?.name ?? "?", count }
    })

    return { forecast, reorder, slow, tiedUp, weekday, peakHour, bestDay, next7, last7, together }
  }, [products, sales, now])

  const canOrder = can(user?.role, "purchase.manage")
  const openOrders = purchaseOrders.filter((o) => o.status === "pending" || o.status === "approved").length

  const createOrders = () => {
    const bySupplier = new Map<string, typeof view.reorder>()
    view.reorder.forEach((f) => {
      const key = f.product.supplierId ?? suppliers[0]?.id ?? ""
      bySupplier.set(key, [...(bySupplier.get(key) ?? []), f])
    })
    let n = 0
    bySupplier.forEach((list, supplierId) => {
      const id = generateId()
      const items = list.map((f) => ({ id: generateId(), purchaseOrderId: id, productId: f.product.id, quantity: f.suggest, received: 0, unitPrice: f.product.costPrice, total: f.product.costPrice * f.suggest }))
      const order: PurchaseOrder = {
        id, businessId: user?.businessId ?? "", supplierId, warehouseId: warehouses[0]?.id ?? "", orderNumber: `PO-${3300 + purchaseOrders.length + n}`,
        status: "pending", total: items.reduce((s, i) => s + i.total, 0), notes: "Suggested by Insights", items, createdBy: user?.id ?? "",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      addPurchaseOrder(order)
      logAudit("Purchase order created", "Purchase order", `${order.orderNumber} suggested by Insights (${formatCurrency(order.total)})`)
      n++
    })
    notify.success(`${n} purchase order${n === 1 ? "" : "s"} created`, "Review and approve them under Inventory → Purchase Orders.")
  }

  const growth = view.last7 > 0 ? ((view.next7 - view.last7) / view.last7) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" description="What to reorder, what's slowing down, and when your shop is busiest. Worked out from your own sales history." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Running out within 14 days" value={view.reorder.length.toString()} icon={AlertTriangle} changeType={view.reorder.length ? "negative" : "positive"} change={view.reorder.length ? "Reorder soon" : "Stock looks healthy"} />
        <StatsCard title="Forecast, next 7 days" value={formatCurrency(view.next7)} icon={TrendingUp} change={`${growth >= 0 ? "+" : ""}${growth.toFixed(0)}% vs last 7 days`} changeType={growth >= 0 ? "positive" : "negative"} />
        <StatsCard title="Busiest day" value={view.bestDay?.label ?? "—"} icon={CalendarDays} change={view.bestDay ? `${formatCurrency(view.bestDay.average)} on average` : undefined} />
        <StatsCard title="Peak hour" value={view.peakHour !== undefined ? `${view.peakHour}:00` : "—"} icon={Clock} change="Schedule your strongest cashiers here" />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Sparkles className="h-5 w-5 text-blue-600" />Suggested reorders</h3>
            <p className="text-xs text-gray-500">Based on the last 30 days of sales, aiming for {COVER_DAYS} days of cover{openOrders ? ` · ${openOrders} order(s) already open` : ""}</p>
          </div>
          {canOrder && view.reorder.length > 0 && <Button onClick={createOrders}>Create purchase orders</Button>}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Selling</TableHead><TableHead>In stock</TableHead><TableHead>Runs out in</TableHead><TableHead>Suggested order</TableHead><TableHead>Cost</TableHead></TableRow></TableHeader>
            <TableBody>
              {view.reorder.map((f) => (
                <TableRow key={f.product.id}>
                  <TableCell className="font-medium">{f.product.name}</TableCell>
                  <TableCell>{f.velocity.toFixed(1)}/day</TableCell>
                  <TableCell>{f.stock}</TableCell>
                  <TableCell><Badge variant={f.daysLeft <= 3 ? "danger" : "warning"}>{f.daysLeft < 1 ? "today" : `${Math.round(f.daysLeft)} days`}</Badge></TableCell>
                  <TableCell className="font-medium">{f.suggest} units</TableCell>
                  <TableCell>{formatCurrency(f.suggest * f.product.costPrice)}</TableCell>
                </TableRow>
              ))}
              {view.reorder.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">Nothing needs reordering right now.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Average net sales by weekday</h3><p className="text-xs text-gray-500">Last 8 weeks</p></CardHeader>
          <CardContent>
            <div className="h-56" role="img" aria-label="Average net sales per weekday">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.weekday} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Average"]} cursor={{ fill: "var(--chart-grid)", opacity: 0.4 }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="average" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Often bought together</h3><p className="text-xs text-gray-500">Put these side by side or bundle them</p></CardHeader>
          <CardContent className="space-y-3">
            {view.together.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm"><span className="text-gray-900">{t.a} <span className="text-gray-400">+</span> {t.b}</span><Badge>{t.count}×</Badge></div>
            ))}
            {view.together.length === 0 && <p className="py-4 text-center text-sm text-gray-500">Not enough sales yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Slow movers</h3><p className="text-xs text-gray-500">{formatCurrency(view.tiedUp)} of cash is tied up in products that sell less than one every five days. Consider a promotion.</p></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Sold (30 days)</TableHead><TableHead>In stock</TableHead><TableHead>Cash tied up</TableHead></TableRow></TableHeader>
            <TableBody>
              {view.slow.map((f) => <TableRow key={f.product.id}><TableCell className="font-medium">{f.product.name}</TableCell><TableCell>{Math.round(f.velocity * 30)}</TableCell><TableCell>{f.stock}</TableCell><TableCell>{formatCurrency(f.stock * f.product.costPrice)}</TableCell></TableRow>)}
              {view.slow.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">Everything is selling at a healthy pace.</TableCell></TableRow>}
            </TableBody>
          </Table>
          {view.slow.length > 0 && can(user?.role, "price.change") && <div className="border-t border-gray-100 px-6 py-3 text-sm"><Link href="/promotions" className="text-blue-600 hover:underline">Create a promotion →</Link></div>}
        </CardContent>
      </Card>
    </div>
  )
}
