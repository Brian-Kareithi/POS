"use client"

import { useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { inRange } from "@/lib/utils/analytics"
import { formatCurrency } from "@/lib/utils/format"
import { DollarSign, Percent, Receipt } from "lucide-react"

export default function TaxReportsPage() {
  const products = useDataStore((s) => s.products)
  const { sales, label: branchLabel } = useBranchFilter()
  const state = useReportRange("month")

  const view = useMemo(() => {
    const rates = new Map<number, { taxable: number; tax: number }>()
    let refundedTax = 0
    sales.filter((s) => inRange(s.createdAt, state.range)).forEach((sale) => {
      if (sale.status === "refunded") refundedTax += sale.taxTotal
      if (sale.status !== "completed") return
      sale.items?.forEach((i) => {
        const rate = products.find((p) => p.id === i.productId)?.taxRate ?? 0
        const row = rates.get(rate) ?? { taxable: 0, tax: 0 }
        row.taxable += i.unitPrice * i.quantity - i.discount
        row.tax += i.tax
        rates.set(rate, row)
      })
    })
    const rows = [...rates.entries()].sort((a, b) => b[0] - a[0]).map(([rate, v]) => ({ rate, ...v }))
    return { rows, taxable: rows.reduce((s, r) => s + r.taxable, 0), tax: rows.reduce((s, r) => s + r.tax, 0), refundedTax }
  }, [sales, products, state.range])

  const rows = () => view.rows.map((r) => ({ "VAT rate %": r.rate, "Taxable sales": Math.round(r.taxable), "VAT collected": Math.round(r.tax) }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="VAT Report" description="Output VAT collected, grouped by rate, ready for your return" />
      <ReportToolbar state={state} branchLabel={branchLabel} rows={rows} filename="vat-report" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="VAT collected" value={formatCurrency(view.tax)} icon={DollarSign} />
        <StatsCard title="Taxable sales (before VAT)" value={formatCurrency(view.taxable)} icon={Receipt} />
        <StatsCard title="Effective rate" value={view.taxable > 0 ? `${((view.tax / view.taxable) * 100).toFixed(1)}%` : "0%"} icon={Percent} change={view.refundedTax ? `${formatCurrency(view.refundedTax)} VAT reversed on refunds` : undefined} />
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">VAT by rate</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Rate</TableHead><TableHead>Taxable sales</TableHead><TableHead>VAT collected</TableHead></TableRow></TableHeader>
            <TableBody>
              {view.rows.map((r) => <TableRow key={r.rate}><TableCell className="font-medium">{r.rate === 0 ? "Zero-rated / exempt" : `${r.rate}%`}</TableCell><TableCell>{formatCurrency(r.taxable)}</TableCell><TableCell>{formatCurrency(r.tax)}</TableCell></TableRow>)}
              {view.rows.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-gray-500">No sales in this period.</TableCell></TableRow>}
              <TableRow><TableCell><strong>Total</strong></TableCell><TableCell><strong>{formatCurrency(view.taxable)}</strong></TableCell><TableCell><strong>{formatCurrency(view.tax)}</strong></TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-gray-400">Every receipt carries a KRA eTIMS reference. Connect your eTIMS credentials under Settings to submit invoices automatically.</p>
    </div>
  )
}
