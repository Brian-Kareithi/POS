"use client"

import { useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/format"

export default function AccountingReportsPage() {
  const { transactions, sales } = useDataStore()
  const salesRevenue = sales.reduce((s, sale) => s + sale.total, 0)
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const netProfit = salesRevenue + totalIncome - totalExpenses
  const profitMargin = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0

  const reports = [
    { title: "Profit & Loss", items: [
      { label: "Sales Revenue", value: formatCurrency(salesRevenue), type: "positive" },
      { label: "Other Income", value: formatCurrency(totalIncome), type: "positive" },
      { label: "Total Expenses", value: formatCurrency(totalExpenses), type: "negative" },
      { label: "Net Profit", value: formatCurrency(netProfit), type: netProfit >= 0 ? "positive" : "negative" },
    ]},
    { title: "Key Metrics", items: [
      { label: "Profit Margin", value: `${profitMargin.toFixed(1)}%`, type: profitMargin >= 0 ? "positive" : "negative" },
      { label: "Revenue per Sale", value: sales.length > 0 ? formatCurrency(salesRevenue / sales.length) : "$0.00", type: "neutral" },
    ]},
    { title: "Tax Summary", items: [
      { label: "Total Tax Collected", value: formatCurrency(sales.reduce((s, sale) => s + sale.taxTotal, 0)), type: "neutral" },
    ]},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Accounting Reports" description="Financial summaries" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader><h3 className="text-lg font-semibold text-gray-900">{report.title}</h3></CardHeader>
            <CardContent className="space-y-3">
              {report.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-semibold ${item.type === "positive" ? "text-green-600" : item.type === "negative" ? "text-red-600" : "text-gray-900"}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
