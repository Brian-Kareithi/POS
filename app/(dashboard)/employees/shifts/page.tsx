"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useEffect, useState } from "react"
import Link from "next/link"
import { api, errorMessage } from "@/lib/api/client"
import { toShift } from "@/lib/api/mappers"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { can } from "@/lib/permissions"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import type { Sale, ShiftRecord } from "@/lib/types"
import { notify } from "@/lib/toast"
import { Clock, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function ShiftsPage() {
  const now = useNow()
  const user = useAuthStore((s) => s.user)
  const { shiftRecords, branches, users, sales } = useDataStore()
  const [detail, setDetail] = useState<ShiftRecord | null>(null)
  const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? (id === user?.id ? user.name : "Staff")
  // The server works out what should be in the drawer from the ledger of sales; the till never computes it.
  const [expectedNow, setExpectedNow] = useState(0)
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<"open" | "close" | null>(null)
  const [float, setFloat] = useState("5000")
  const [counted, setCounted] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const seesAll = can(user?.role, "staff.view")
  const visible = shiftRecords.filter((s) => seesAll || s.userId === user?.id)
  const mine = shiftRecords.find((s) => s.userId === user?.id && !s.closedAt)
  const countedNum = parseFloat(counted)
  const variance = Number.isNaN(countedNum) ? 0 : countedNum - expectedNow

  const weekAgo = now - 7 * 86400000
  const weekShifts = shiftRecords.filter((s) => s.closedAt && new Date(s.openedAt).getTime() >= weekAgo)
  const weekVariance = weekShifts.reduce((sum, s) => sum + (s.variance ?? 0), 0)
  const openCount = shiftRecords.filter((s) => !s.closedAt).length

  useEffect(() => {
    if (!mine) return
    api<{ shift: { expectedCash: number } | null }>("/shifts/current")
      .then((r) => r.shift && setExpectedNow(r.shift.expectedCash))
      .catch(() => {})
  }, [mine?.id, dialog])

  const doOpen = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(float)
    if (!user || Number.isNaN(amount) || amount < 0) return setError("Enter the opening cash in the drawer.")
    setBusy(true)
    try {
      const shift = toShift(await api("/shifts/open", { method: "POST", body: { openingCash: amount, branchId: user.branchId ?? branches[0]?.id } }), nameOf)
      useDataStore.getState().upsert("shiftRecords", shift, true)
    } catch (err) {
      setBusy(false)
      return setError(errorMessage(err, "Could not open the shift."))
    }
    setBusy(false)
    notify.success("Shift opened", `Float KES ${amount.toLocaleString()}`)
    setDialog(null)
    setError("")
  }

  const doClose = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mine) return
    if (Number.isNaN(countedNum) || countedNum < 0) return setError("Count the cash in the drawer and enter the total.")
    if (variance !== 0 && !notes.trim()) return setError("The drawer doesn't match. Please add a short note explaining the difference.")
    setBusy(true)
    try {
      const closed = toShift(await api(`/shifts/${mine.id}/close`, { method: "POST", body: { countedCash: countedNum, ...(notes.trim() ? { notes: notes.trim() } : {}) } }), nameOf)
      useDataStore.getState().upsert("shiftRecords", closed)
      if (closed.variance === 0) notify.success("Shift closed", "The drawer balances.")
      else notify.warning("Shift closed", `Variance KES ${(closed.variance ?? 0).toLocaleString()}`)
    } catch (err) {
      setBusy(false)
      return setError(errorMessage(err, "Could not close the shift."))
    }
    setBusy(false)
    setDialog(null)
    setCounted("")
    setNotes("")
    setError("")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Shifts & Cash" description="Open and close tills, and reconcile cash against what the system expects">
        {mine
          ? <Button onClick={() => { setDialog("close"); setError("") }}><Clock className="h-4 w-4" />Close my shift</Button>
          : <Button onClick={() => { setDialog("open"); setError("") }}><Clock className="h-4 w-4" />Open my shift</Button>}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Open shifts now" value={String(openCount)} icon={Clock} />
        <StatsCard title="Cash variance, last 7 days" value={`${weekVariance >= 0 ? "+" : ""}${formatCurrency(weekVariance)}`} changeType={weekVariance < 0 ? "negative" : "positive"} change={weekVariance === 0 ? "Drawers balanced" : weekVariance < 0 ? "Cash is short" : "Cash is over"} icon={Wallet} />
        <StatsCard title="Shifts closed, last 7 days" value={String(weekShifts.length)} icon={CheckCircle2} />
      </div>

      {mine && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Your shift is open since {formatDateTime(mine.openedAt)}</p>
              <p className="text-lg font-semibold text-gray-900">Expected in drawer: {formatCurrency(expectedNow)}</p>
              <p className="text-xs text-gray-500">Opening float {formatCurrency(mine.openingCash)} + cash sales {formatCurrency(expectedNow - mine.openingCash)}</p>
            </div>
            <Badge variant="success">Active</Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Shift history</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Branch</TableHead><TableHead>Opened</TableHead><TableHead>Closed</TableHead><TableHead>Opening</TableHead><TableHead>Expected</TableHead><TableHead>Counted</TableHead><TableHead>Variance</TableHead><TableHead><span className="sr-only">Details</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {visible.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.userName}</TableCell>
                  <TableCell className="text-gray-500">{branches.find((b) => b.id === s.branchId)?.name ?? "-"}</TableCell>
                  <TableCell>{formatDateTime(s.openedAt)}</TableCell>
                  <TableCell>{s.closedAt ? formatDateTime(s.closedAt) : <Badge variant="success">Open</Badge>}</TableCell>
                  <TableCell>{formatCurrency(s.openingCash)}</TableCell>
                  <TableCell>{s.expectedCash != null ? formatCurrency(s.expectedCash) : "-"}</TableCell>
                  <TableCell>{s.countedCash != null ? formatCurrency(s.countedCash) : "-"}</TableCell>
                  <TableCell>
                    {s.variance == null ? "-" : (
                      <span title={s.notes} className="inline-flex items-center gap-1">
                        <Badge variant={s.variance === 0 ? "success" : Math.abs(s.variance) >= 500 ? "danger" : "warning"}>{s.variance === 0 ? "Balanced" : `${s.variance > 0 ? "+" : ""}${s.variance.toLocaleString()}`}</Badge>
                        {Math.abs(s.variance) >= 500 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </span>
                    )}
                  </TableCell>
                  <TableCell><button onClick={() => setDetail(s)} className="text-xs font-medium text-blue-600 hover:underline" aria-label={`Details of ${s.userName}'s shift`}>Details</button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onClose={() => setDetail(null)} title="Shift details" size="lg">
        {detail && <ShiftDetail shift={detail} branchName={branches.find((b) => b.id === detail.branchId)?.name ?? "-"} sales={sales.filter((x) => x.shiftId === detail.id)} />}
      </Dialog>

      <Dialog open={dialog === "open"} onClose={() => setDialog(null)} title="Open shift" size="sm">
        <form onSubmit={doOpen} className="space-y-4">
          <p className="text-sm text-gray-500">Count the cash float in the drawer before you start selling.</p>
          <Input label="Opening cash (KES)" type="number" min="0" step={100} value={float} onChange={(e) => setFloat(e.target.value)} autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" isLoading={busy}>Open shift</Button></div>
        </form>
      </Dialog>

      <Dialog open={dialog === "close"} onClose={() => setDialog(null)} title="Close shift" size="sm">
        <form onSubmit={doClose} className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Expected in drawer</span><span className="font-semibold">{formatCurrency(expectedNow)}</span></div>
          </div>
          <Input label="Cash counted (KES)" type="number" min="0" step={100} value={counted} onChange={(e) => setCounted(e.target.value)} autoFocus />
          {counted !== "" && (
            <p className={`rounded-lg px-3 py-2 text-sm font-medium ${variance === 0 ? "bg-green-50 text-green-700" : Math.abs(variance) >= 500 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>
              {variance === 0 ? "The drawer balances." : variance < 0 ? `Short by ${formatCurrency(-variance)}` : `Over by ${formatCurrency(variance)}`}
            </p>
          )}
          {variance !== 0 && counted !== "" && <Textarea label="Explain the difference" value={notes} onChange={(e) => setNotes(e.target.value)} />}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" isLoading={busy}>Close shift</Button></div>
        </form>
      </Dialog>
    </div>
  )
}

/** Who worked the shift, what the till should hold, what was counted, and every sale rung up during it. */
function ShiftDetail({ shift, branchName, sales }: { shift: ShiftRecord; branchName: string; sales: Sale[] }) {
  const done = sales.filter((x) => x.status === "completed")
  const cashIn = done.reduce((sum, x) => sum + (x.payments ?? []).filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0), 0)
  const byMethod = done.flatMap((x) => x.payments ?? []).reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.method]: (acc[p.method] ?? 0) + p.amount }), {})
  const row = (label: string, value: React.ReactNode) => <div className="flex justify-between gap-4 text-sm"><span className="text-gray-500">{label}</span><span className="text-right font-medium text-gray-900">{value}</span></div>
  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-xl bg-gray-50 p-4">
        {row("Cashier", shift.userName)}
        {row("Branch", branchName)}
        {row("Opened", formatDateTime(shift.openedAt))}
        {row("Closed", shift.closedAt ? formatDateTime(shift.closedAt) : "Still open")}
        {row("Opening cash", formatCurrency(shift.openingCash))}
        {row("Cash from sales", formatCurrency(cashIn))}
        {row("Expected in drawer", shift.expectedCash != null ? formatCurrency(shift.expectedCash) : "Worked out when the shift closes")}
        {shift.countedCash != null && row("Counted", formatCurrency(shift.countedCash))}
        {shift.variance != null && row("Difference", <span className={shift.variance === 0 ? "text-green-600" : "text-red-600"}>{shift.variance === 0 ? "Balanced" : `${shift.variance > 0 ? "Over" : "Short"} by ${formatCurrency(Math.abs(shift.variance))}`}</span>)}
        {shift.notes && row("Note", shift.notes)}
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-900">Takings by method ({done.length} sale{done.length === 1 ? "" : "s"})</p>
        {Object.keys(byMethod).length === 0 ? <p className="text-sm text-gray-500">No completed sales on this shift.</p> : (
          <div className="flex flex-wrap gap-2">{Object.entries(byMethod).map(([m, amount]) => <Badge key={m}>{PAYMENT_METHOD_LABELS[m] ?? m}: {formatCurrency(amount)}</Badge>)}</div>
        )}
      </div>
      {sales.length > 0 && (
        <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-100">
          {sales.map((x) => (
            <Link key={x.id} href={`/sales/${x.id}`} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50">
              <span><span className="font-medium text-gray-900">{x.receiptNumber ?? x.orderNumber}</span><span className="ml-2 text-xs text-gray-500">{formatDateTime(x.createdAt)}</span></span>
              <span className="flex items-center gap-2">{x.status !== "completed" && <Badge variant="danger">{x.status === "cancelled" ? "voided" : x.status}</Badge>}{formatCurrency(x.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
