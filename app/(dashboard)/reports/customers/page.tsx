"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { inRange } from "@/lib/utils/analytics"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Award, HandCoins, Users, UserCheck } from "lucide-react"

export default function CustomerReportsPage() {
  const now = useNow()
  const customers = useDataStore((s) => s.customers)
  const { sales, label: branchLabel } = useBranchFilter()
  const state = useReportRange("30d")

  const view = useMemo(() => {
    const cur = sales.filter((s) => s.status === "completed" && inRange(s.createdAt, state.range))
    const rows = customers.map((c) => {
      const mine = cur.filter((s) => s.customerId === c.id)
      return { customer: c, orders: mine.length, spend: mine.reduce((a, s) => a + s.total, 0), last: mine[0]?.createdAt }
    }).filter((r) => r.orders > 0).sort((a, b) => b.spend - a.spend)
    const walkIn = cur.filter((s) => !s.customerId).length
    return { rows, walkIn, total: cur.length }
  }, [customers, sales, state.range])

  const owing = customers.filter((c) => (c.amountOwed ?? 0) > 0).sort((a, b) => (b.amountOwed ?? 0) - (a.amountOwed ?? 0))
  const totalOwed = owing.reduce((s, c) => s + (c.amountOwed ?? 0), 0)
  const overdue = owing.filter((c) => c.creditDueDate && new Date(c.creditDueDate).getTime() < now)
  const points = customers.reduce((s, c) => s + c.loyaltyPoints, 0)

  const rows = () => view.rows.map((r) => ({ Customer: r.customer.name, Phone: r.customer.phone, Orders: r.orders, Spend: Math.round(r.spend), "Loyalty points": r.customer.loyaltyPoints, Owes: r.customer.amountOwed ?? 0 }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="Customer Report" description="Who buys most, who owes the shop money and what loyalty points are worth" />
      <ReportToolbar state={state} branchLabel={branchLabel} rows={rows} filename="customer-report" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Registered customers" value={customers.length.toString()} icon={Users} />
        <StatsCard title="Walk-in sales in period" value={view.walkIn.toString()} icon={UserCheck} change={view.total ? `${Math.round((view.walkIn / view.total) * 100)}% of sales` : undefined} />
        <StatsCard title="Owed by customers" value={formatCurrency(totalOwed)} icon={HandCoins} changeType={overdue.length ? "negative" : "neutral"} change={overdue.length ? `${overdue.length} overdue` : undefined} />
        <StatsCard title="Loyalty points issued" value={points.toLocaleString()} icon={Award} change={`Worth ${formatCurrency(points)} if all redeemed`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Top customers</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Orders</TableHead><TableHead>Spend</TableHead><TableHead>Points</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.rows.map((r) => <TableRow key={r.customer.id}><TableCell><Link href={`/customers/${r.customer.id}`} className="font-medium text-blue-600 hover:underline">{r.customer.name}</Link></TableCell><TableCell>{r.orders}</TableCell><TableCell>{formatCurrency(r.spend)}</TableCell><TableCell>{r.customer.loyaltyPoints.toLocaleString()}</TableCell></TableRow>)}
                {view.rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">No customer purchases in this period.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Customer credit (receivables)</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Owes</TableHead><TableHead>Limit</TableHead><TableHead>Due</TableHead></TableRow></TableHeader>
              <TableBody>
                {owing.map((c) => {
                  const late = c.creditDueDate && new Date(c.creditDueDate).getTime() < now
                  return <TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{formatCurrency(c.amountOwed ?? 0)}</TableCell><TableCell className="text-gray-500">{formatCurrency(c.creditLimit ?? 0)}</TableCell><TableCell>{c.creditDueDate ? <Badge variant={late ? "danger" : "default"}>{late ? "Overdue" : formatDate(c.creditDueDate)}</Badge> : "—"}</TableCell></TableRow>
                })}
                {owing.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">Nobody owes the shop money.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
