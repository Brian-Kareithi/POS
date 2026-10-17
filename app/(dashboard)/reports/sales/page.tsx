"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useDataStore } from "@/lib/stores/data-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { change, inRange, paymentBreakdown, summarize } from "@/lib/utils/analytics"
import { formatCurrency } from "@/lib/utils/format"
import { Banknote, Percent, Receipt, RotateCcw, ShoppingCart, Tag, TrendingUp, Wallet } from "lucide-react"

const METHOD: Record<string, string> = { cash: "Cash", card: "Card", mobile_money: "M-Pesa", bank_transfer: "Bank transfer", credit: "On credit" }
const pct = (v: number | null) => (v === null ? undefined : `${v >= 0 ? "+" : ""}${v.toFixed(1)}% vs previous period`)

export default function SalesReportsPage() {
  const products = useDataStore((s) => s.products)
  const branches = useDataStore((s) => s.branches)
  const allSales = useDataStore((s) => s.sales)
  const { sales, label: branchLabel, branchId } = useBranchFilter()
  const state = useReportRange("30d")

  const view = useMemo(() => {
    const cur = sales.filter((s) => inRange(s.createdAt, state.range))
    const prev = sales.filter((s) => inRange(s.createdAt, state.previous))
    const days = new Map<string, typeof cur>()
    cur.forEach((s) => {
      const key = s.createdAt.slice(0, 10)
      days.set(key, [...(days.get(key) ?? []), s])
    })
    const daily = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => {
      const sum = summarize(list, products)
      return { date, label: new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "short" }), transactions: sum.transactions, net: Math.round(sum.net), profit: Math.round(sum.grossProfit) }
    })
    return { cur, sum: summarize(cur, products), prev: summarize(prev, products), daily, payments: paymentBreakdown(cur) }
  }, [sales, state.range, state.previous, products])

  const { sum, prev } = view
  const paymentTotal = view.payments.reduce((s, p) => s + p.amount, 0) || 1
  const branchRows = branches.map((b) => {
    const s = summarize(allSales.filter((x) => x.branchId === b.id && inRange(x.createdAt, state.range)), products)
    return { name: b.name, ...s }
  })

  const rows = () => view.daily.map((d) => ({ Date: d.date, Transactions: d.transactions, "Net sales": d.net, "Gross profit": d.profit }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="Sales Report" description="Gross and net sales, cost of goods sold and gross profit" />
      <ReportToolbar state={state} branchLabel={branchLabel} rows={rows} filename="sales-report" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Gross sales" value={formatCurrency(sum.gross)} icon={ShoppingCart} change={pct(change(sum.gross, prev.gross))} changeType={(change(sum.gross, prev.gross) ?? 0) >= 0 ? "positive" : "negative"} />
        <StatsCard title="Discounts" value={formatCurrency(sum.discounts)} icon={Tag} />
        <StatsCard title="Refunds" value={formatCurrency(sum.refunds)} icon={RotateCcw} />
        <StatsCard title="Net sales" value={formatCurrency(sum.net)} icon={Banknote} change={pct(change(sum.net, prev.net))} changeType={(change(sum.net, prev.net) ?? 0) >= 0 ? "positive" : "negative"} />
        <StatsCard title="Cost of goods sold" value={formatCurrency(sum.cogs)} icon={Wallet} />
        <StatsCard title="Gross profit" value={formatCurrency(sum.grossProfit)} icon={TrendingUp} change={`${sum.margin.toFixed(1)}% margin`} changeType="positive" />
        <StatsCard title="VAT collected" value={formatCurrency(sum.taxes)} icon={Percent} />
        <StatsCard title="Transactions" value={sum.transactions.toLocaleString()} icon={Receipt} change={sum.transactions ? `${formatCurrency(sum.net / sum.transactions)} average basket` : undefined} />
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Net sales by day</h3></CardHeader>
        <CardContent>
          <div className="h-64" role="img" aria-label="Net sales by day">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Net sales"]} cursor={{ fill: "var(--chart-grid)", opacity: 0.4 }} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="net" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Payment breakdown</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Share</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.payments.map((p) => (
                  <TableRow key={p.method}><TableCell className="font-medium">{METHOD[p.method] ?? p.method}</TableCell><TableCell>{formatCurrency(p.amount)}</TableCell><TableCell>{((p.amount / paymentTotal) * 100).toFixed(1)}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Branch comparison</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Branch</TableHead><TableHead>Net sales</TableHead><TableHead>Gross profit</TableHead><TableHead>Margin</TableHead></TableRow></TableHeader>
              <TableBody>
                {branchRows.map((b) => (
                  <TableRow key={b.name} className={branchId !== "all" && branches.find((x) => x.id === branchId)?.name !== b.name ? "opacity-50" : ""}><TableCell className="font-medium">{b.name}</TableCell><TableCell>{formatCurrency(b.net)}</TableCell><TableCell>{formatCurrency(b.grossProfit)}</TableCell><TableCell>{b.margin.toFixed(1)}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Daily summary</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Transactions</TableHead><TableHead>Net sales</TableHead><TableHead>Gross profit</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...view.daily].reverse().map((d) => (
                <TableRow key={d.date}><TableCell>{d.date}</TableCell><TableCell>{d.transactions}</TableCell><TableCell>{formatCurrency(d.net)}</TableCell><TableCell>{formatCurrency(d.profit)}</TableCell></TableRow>
              ))}
              {view.daily.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">No sales in this period.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
