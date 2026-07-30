"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/format"
import { Percent, DollarSign, Download } from "lucide-react"

export default function TaxReportsPage() {
  const sales = useDataStore((s) => s.sales)
  const totalTax = sales.reduce((s, sale) => s + sale.taxTotal, 0)
  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Tax Reports" description="Tax collection summaries">
        <Button variant="secondary"><Download className="h-4 w-4" />Export</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Tax Collected" value={formatCurrency(totalTax)} icon={DollarSign} />
        <StatsCard title="Taxable Sales" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <StatsCard title="Effective Rate" value={totalRevenue > 0 ? `${((totalTax / totalRevenue) * 100).toFixed(1)}%` : "0%"} icon={Percent} />
      </div>
      <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900">Tax Breakdown</h3></CardHeader>
        <CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell className="font-medium">Sales Tax (8%)</TableCell><TableCell>{formatCurrency(totalTax * 0.6)}</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">VAT (16%)</TableCell><TableCell>{formatCurrency(totalTax * 0.4)}</TableCell></TableRow>
            <TableRow><TableCell><strong>Total</strong></TableCell><TableCell><strong>{formatCurrency(totalTax)}</strong></TableCell></TableRow>
          </TableBody></Table>
        </CardContent></Card>
    </div>
  )
}
