"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency } from "@/lib/utils/format"
import { TrendingUp, TrendingDown, Percent, Download } from "lucide-react"

export default function ProfitReportsPage() {
  const { sales, transactions } = useDataStore()
  const revenue = sales.reduce((s, sale) => s + sale.total, 0)
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const netProfit = revenue + income - expenses
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0
  const costOfGoods = sales.reduce((s, sale) => s + sale.subtotal * 0.6, 0)
  const grossProfit = revenue - costOfGoods

  return (
    <div className="space-y-6">
      <PageHeader title="Profit Reports" description="Profitability analysis">
        <Button variant="secondary"><Download className="h-4 w-4" />Export</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Gross Profit" value={formatCurrency(grossProfit)} changeType="positive" icon={TrendingUp} />
        <StatsCard title="Net Profit" value={formatCurrency(netProfit)} changeType={netProfit >= 0 ? "positive" : "negative"} icon={TrendingUp} />
        <StatsCard title="Profit Margin" value={`${margin.toFixed(1)}%`} changeType={margin >= 0 ? "positive" : "negative"} icon={Percent} />
      </div>
      <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900">Profit Breakdown</h3></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[
              { label: "Total Revenue", value: formatCurrency(revenue), color: "text-green-600" },
              { label: "Cost of Goods Sold", value: formatCurrency(costOfGoods), color: "text-red-600" },
              { label: "Gross Profit", value: formatCurrency(grossProfit), color: "text-green-600", border: true },
              { label: "Other Income", value: formatCurrency(income), color: "text-green-600" },
              { label: "Operating Expenses", value: formatCurrency(expenses), color: "text-red-600" },
              { label: "Net Profit", value: formatCurrency(netProfit), color: netProfit >= 0 ? "text-green-600" : "text-red-600", border: true },
            ].map((item) => (
              <div key={item.label} className={`flex justify-between text-sm py-1 ${item.border ? "border-t border-gray-100 pt-2 mt-1" : ""}`}>
                <span className="text-gray-500">{item.label}</span>
                <span className={`font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
    </div>
  )
}
