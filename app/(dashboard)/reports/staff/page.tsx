"use client"

import { useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { ROLE_LABELS } from "@/lib/permissions"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { inRange, summarize } from "@/lib/utils/analytics"
import { formatCurrency } from "@/lib/utils/format"
import { DollarSign, ShieldAlert, UserCog, Users } from "lucide-react"

export default function StaffReportsPage() {
  const { employees, users, products, auditLogs, shiftRecords } = useDataStore()
  const { sales, label: branchLabel } = useBranchFilter()
  const state = useReportRange("30d")

  const rows = useMemo(() => employees.map((e) => {
    const user = users.find((u) => u.id === e.userId)
    const mine = sales.filter((s) => s.userId === e.userId && inRange(s.createdAt, state.range))
    const sum = summarize(mine, products)
    const flagged = auditLogs.filter((l) => l.userId === e.userId && l.severity !== "info" && inRange(l.createdAt, state.range)).length
    const variance = shiftRecords.filter((s) => s.userId === e.userId && s.closedAt && inRange(s.openedAt, state.range)).reduce((a, s) => a + (s.variance ?? 0), 0)
    return {
      id: e.id, name: user?.name ?? "Unknown", role: e.role, salary: e.salary ?? 0, active: e.isActive,
      transactions: sum.transactions, net: sum.net, basket: sum.transactions ? sum.net / sum.transactions : 0,
      discounts: sum.discounts, refunds: mine.filter((s) => s.status === "refunded" || s.status === "cancelled").length, flagged, variance,
    }
  }), [employees, users, products, sales, auditLogs, shiftRecords, state.range])

  const payroll = rows.reduce((s, r) => s + r.salary, 0)
  const flaggedTotal = rows.reduce((s, r) => s + r.flagged, 0)
  const best = [...rows].sort((a, b) => b.net - a.net)[0]

  const exportRows = () => rows.map((r) => ({ Staff: r.name, Role: ROLE_LABELS[r.role], Transactions: r.transactions, "Net sales": Math.round(r.net), "Avg basket": Math.round(r.basket), Discounts: Math.round(r.discounts), "Refunds/voids": r.refunds, Flagged: r.flagged, "Cash variance": r.variance }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="Staff Report" description="Sales by employee, discounts, refunds and cash accuracy" />
      <ReportToolbar state={state} branchLabel={branchLabel} rows={exportRows} filename="staff-report" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Staff" value={rows.length.toString()} icon={Users} />
        <StatsCard title="Monthly payroll" value={formatCurrency(payroll)} icon={DollarSign} />
        <StatsCard title="Top seller" value={best && best.net > 0 ? best.name.split(" ")[0] : "—"} icon={UserCog} change={best && best.net > 0 ? formatCurrency(best.net) : undefined} />
        <StatsCard title="Flagged actions" value={flaggedTotal.toString()} icon={ShieldAlert} changeType={flaggedTotal ? "negative" : "positive"} change="See the audit log for details" />
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Performance by employee</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Sales</TableHead><TableHead>Net sales</TableHead><TableHead>Avg basket</TableHead><TableHead>Discounts given</TableHead><TableHead>Refunds / voids</TableHead><TableHead>Cash variance</TableHead><TableHead>Flagged</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><span className="font-medium">{r.name}</span><span className="block text-xs text-gray-400">{ROLE_LABELS[r.role]}</span></TableCell>
                  <TableCell>{r.transactions}</TableCell>
                  <TableCell>{formatCurrency(r.net)}</TableCell>
                  <TableCell>{r.transactions ? formatCurrency(r.basket) : "—"}</TableCell>
                  <TableCell>{formatCurrency(r.discounts)}</TableCell>
                  <TableCell>{r.refunds || "—"}</TableCell>
                  <TableCell>{r.variance === 0 ? "—" : <Badge variant={r.variance < 0 ? "danger" : "warning"}>{r.variance > 0 ? "+" : ""}{r.variance.toLocaleString()}</Badge>}</TableCell>
                  <TableCell>{r.flagged ? <Badge variant="warning">{r.flagged}</Badge> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
