"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { can } from "@/lib/permissions"
import { refundSale } from "@/lib/services/checkout"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ApprovalDialog } from "@/components/pos/approval-dialog"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { RefreshCw, DollarSign, ArrowLeft, Undo2 } from "lucide-react"

const reasons = ["Damaged item", "Wrong item", "Customer changed mind", "Expired product", "Pricing error"]

export default function SalesReturnsPage() {
  const customers = useDataStore((s) => s.customers)
  const user = useAuthStore((s) => s.user)
  const { sales } = useBranchFilter()
  const [search, setSearch] = useState("")
  const [target, setTarget] = useState<string | null>(null)

  const customerName = (id?: string) => customers.find((c) => c.id === id)?.name ?? "Walk-in"
  const refunded = useMemo(() => sales.filter((s) => s.status === "refunded" || s.status === "cancelled"), [sales])
  const refundable = useMemo(() => sales.filter((s) => s.status === "completed").slice(0, 30), [sales])
  const filtered = useMemo(() => refunded.filter((s) => (s.receiptNumber ?? s.orderNumber).toLowerCase().includes(search.toLowerCase())), [refunded, search])
  const totalRefunded = refunded.reduce((sum, s) => sum + s.total, 0)
  const sale = sales.find((s) => s.id === target)

  const confirm = async ({ reason, approvalToken }: { reason: string; approvalToken?: string }) => {
    if (!target) return
    try {
      await refundSale(target, "refund", reason, approvalToken)
    } catch (error) {
      notify.error("Couldn't complete that", error instanceof Error ? error.message : undefined)
    }
    setTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Returns & voids" description={`${refunded.length} refunded or voided transactions`}>
        <Link href="/sales"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />Back to Sales</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Refunded" value={formatCurrency(totalRefunded)} icon={DollarSign} />
        <StatsCard title="Returns" value={refunded.length.toString()} icon={RefreshCw} />
        <StatsCard title="Recent sales you can refund" value={refundable.length.toString()} icon={Undo2} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search by receipt number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead>Reason</TableHead><TableHead>Approved by</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="p-0">
                <EmptyState icon={<RefreshCw className="h-12 w-12" />} title="No returns yet" description="Refund a completed sale to see it here." />
              </TableCell></TableRow>
            ) : filtered.slice(0, 50).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium"><Link href={`/sales/${s.id}`} className="text-blue-600 hover:text-blue-700">{s.receiptNumber ?? s.orderNumber}</Link></TableCell>
                <TableCell>{customerName(s.customerId)}</TableCell>
                <TableCell>{formatCurrency(s.total)}</TableCell>
                <TableCell className="text-gray-500">{s.refundReason ?? s.voidReason ?? "-"}</TableCell>
                <TableCell className="text-gray-500">{s.approvedBy ?? "-"}</TableCell>
                <TableCell><Badge variant="danger">{s.status === "cancelled" ? "voided" : "refunded"}</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(s.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {refundable.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Process a return</h3>
            <p className="mb-3 text-sm text-gray-500">{can(user?.role, "refund.issue") ? "Choose a sale and give a reason." : "A manager's PIN is needed to approve a refund."}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {refundable.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.receiptNumber ?? s.orderNumber}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(s.total)} • {customerName(s.customerId)}</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => setTarget(s.id)}>Refund</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ApprovalDialog
        open={!!sale}
        title="Refund sale"
        description={sale ? `${sale.receiptNumber ?? sale.orderNumber} · ${formatCurrency(sale.total)}. Stock goes back on the shelf and this is written to the audit log.` : undefined}
        reasons={reasons}
        needsApproval={!can(user?.role, "refund.issue")}
        confirmLabel="Confirm refund"
        onClose={() => setTarget(null)}
        onConfirm={confirm}
      />
    </div>
  )
}
