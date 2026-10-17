"use client"

import { useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { expensesTotal, inRange, productStats, summarize, txIn } from "@/lib/utils/analytics"
import { formatCurrency } from "@/lib/utils/format"

export default function ProfitReportsPage() {
  const products = useDataStore((s) => s.products)
  const categories = useDataStore((s) => s.categories)
  const { sales, transactions, label: branchLabel } = useBranchFilter()
  const state = useReportRange("month")

  const view = useMemo(() => {
    const cur = sales.filter((s) => inRange(s.createdAt, state.range))
    const sum = summarize(cur, products)
    const expenses = txIn(transactions, state.range).filter((t) => t.type === "expense")
    const byExpense = new Map<string, number>()
    expenses.forEach((t) => byExpense.set(t.category, (byExpense.get(t.category) ?? 0) + t.amount))
    const otherIncome = txIn(transactions, state.range).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const stats = productStats(cur, products).filter((s) => s.quantity > 0).sort((a, b) => b.profit - a.profit)
    const byCategory = categories.map((c) => {
      const rows = stats.filter((s) => s.product.categoryId === c.id)
      const revenue = rows.reduce((a, r) => a + r.revenue, 0)
      const profit = rows.reduce((a, r) => a + r.profit, 0)
      return { name: c.name, revenue, profit, margin: revenue ? (profit / revenue) * 100 : 0 }
    }).filter((c) => c.revenue > 0).sort((a, b) => b.profit - a.profit)
    return { sum, expenses: [...byExpense.entries()].sort((a, b) => b[1] - a[1]), totalExpenses: expensesTotal(txIn(transactions, state.range)), otherIncome, stats, byCategory }
  }, [sales, transactions, products, categories, state.range])

  const net = view.sum.grossProfit - view.totalExpenses + view.otherIncome
  const maxMargin = Math.max(1, ...view.stats.map((s) => s.margin))

  const rows = () => view.stats.map((s) => ({ Product: s.product.name, Units: s.quantity, Revenue: Math.round(s.revenue), Cost: Math.round(s.cost), Profit: Math.round(s.profit), "Margin %": Number(s.margin.toFixed(1)) }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="Profit Report" description="Profit is worked out from what the goods actually cost, not just sales minus expenses" />
      <ReportToolbar state={state} branchLabel={branchLabel} rows={rows} filename="profit-report" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Profit & loss</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Gross sales</span><span>{formatCurrency(view.sum.gross)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Less discounts</span><span className="text-red-600">-{formatCurrency(view.sum.discounts)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-medium"><span>Net sales</span><span>{formatCurrency(view.sum.net)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cost of goods sold</span><span className="text-red-600">-{formatCurrency(view.sum.cogs)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold"><span>Gross profit <span className="font-normal text-gray-400">({view.sum.margin.toFixed(1)}%)</span></span><span>{formatCurrency(view.sum.grossProfit)}</span></div>
            {view.expenses.map(([category, amount]) => (
              <div key={category} className="flex justify-between"><span className="text-gray-500">{category}</span><span className="text-red-600">-{formatCurrency(amount)}</span></div>
            ))}
            {view.otherIncome > 0 && <div className="flex justify-between"><span className="text-gray-500">Other income</span><span className="text-green-600">+{formatCurrency(view.otherIncome)}</span></div>}
            <div className="flex justify-between border-t-2 border-gray-200 pt-3 text-lg font-bold"><span>Net profit</span><span className={net < 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(net)}</span></div>
            <p className="text-xs text-gray-400">VAT collected ({formatCurrency(view.sum.taxes)}) belongs to KRA and isn&apos;t counted as income.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Margin by category</h3></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Revenue</TableHead><TableHead>Profit</TableHead><TableHead>Margin</TableHead></TableRow></TableHeader>
              <TableBody>
                {view.byCategory.map((c) => (
                  <TableRow key={c.name}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{formatCurrency(c.revenue)}</TableCell><TableCell>{formatCurrency(c.profit)}</TableCell><TableCell><Badge variant={c.margin >= 50 ? "success" : c.margin >= 30 ? "default" : "warning"}>{c.margin.toFixed(1)}%</Badge></TableCell></TableRow>
                ))}
                {view.byCategory.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">No sales in this period.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Profit by product</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Units</TableHead><TableHead>Revenue</TableHead><TableHead>Cost</TableHead><TableHead>Profit</TableHead><TableHead className="w-48">Margin</TableHead></TableRow></TableHeader>
            <TableBody>
              {view.stats.map((s) => (
                <TableRow key={s.product.id}>
                  <TableCell className="font-medium">{s.product.name}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{formatCurrency(s.revenue)}</TableCell>
                  <TableCell>{formatCurrency(s.cost)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(s.profit)}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${(s.margin / maxMargin) * 100}%`, background: "var(--series-1)" }} /></div><span className="w-12 text-right text-xs text-gray-600">{s.margin.toFixed(0)}%</span></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
