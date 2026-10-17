"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useState } from "react"
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
import { expectedCash } from "@/lib/utils/analytics"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { notify } from "@/lib/toast"
import { Clock, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function ShiftsPage() {
  const now = useNow()
  const user = useAuthStore((s) => s.user)
  const { shiftRecords, sales, branches, openShift, closeShift } = useDataStore()
  const [dialog, setDialog] = useState<"open" | "close" | null>(null)
  const [float, setFloat] = useState("5000")
  const [counted, setCounted] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const seesAll = can(user?.role, "staff.view")
  const visible = shiftRecords.filter((s) => seesAll || s.userId === user?.id)
  const mine = shiftRecords.find((s) => s.userId === user?.id && !s.closedAt)
  const expectedNow = mine ? expectedCash(mine, sales) : 0
  const countedNum = parseFloat(counted)
  const variance = Number.isNaN(countedNum) ? 0 : countedNum - expectedNow

  const weekAgo = now - 7 * 86400000
  const weekShifts = shiftRecords.filter((s) => s.closedAt && new Date(s.openedAt).getTime() >= weekAgo)
  const weekVariance = weekShifts.reduce((sum, s) => sum + (s.variance ?? 0), 0)
  const openCount = shiftRecords.filter((s) => !s.closedAt).length

  const doOpen = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(float)
    if (!user || Number.isNaN(amount) || amount < 0) return setError("Enter the opening cash in the drawer.")
    openShift({ id: generateId(), userId: user.id, userName: user.name, branchId: user.branchId ?? branches[0]?.id ?? "", openedAt: new Date().toISOString(), openingCash: amount })
    notify.success("Shift opened", `Float KES ${amount.toLocaleString()}`)
    setDialog(null)
    setError("")
  }

  const doClose = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mine) return
    if (Number.isNaN(countedNum) || countedNum < 0) return setError("Count the cash in the drawer and enter the total.")
    if (variance !== 0 && !notes.trim()) return setError("The drawer doesn't match. Please add a short note explaining the difference.")
    closeShift(mine.id, { closedAt: new Date().toISOString(), expectedCash: expectedNow, countedCash: countedNum, variance, notes: notes.trim() || undefined })
    if (variance === 0) notify.success("Shift closed", "The drawer balances.")
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
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Branch</TableHead><TableHead>Opened</TableHead><TableHead>Closed</TableHead><TableHead>Opening</TableHead><TableHead>Expected</TableHead><TableHead>Counted</TableHead><TableHead>Variance</TableHead></TableRow></TableHeader>
            <TableBody>
              {visible.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.userName}</TableCell>
                  <TableCell className="text-gray-500">{branches.find((b) => b.id === s.branchId)?.name ?? "—"}</TableCell>
                  <TableCell>{formatDateTime(s.openedAt)}</TableCell>
                  <TableCell>{s.closedAt ? formatDateTime(s.closedAt) : <Badge variant="success">Open</Badge>}</TableCell>
                  <TableCell>{formatCurrency(s.openingCash)}</TableCell>
                  <TableCell>{s.expectedCash != null ? formatCurrency(s.expectedCash) : "—"}</TableCell>
                  <TableCell>{s.countedCash != null ? formatCurrency(s.countedCash) : "—"}</TableCell>
                  <TableCell>
                    {s.variance == null ? "—" : (
                      <span title={s.notes} className="inline-flex items-center gap-1">
                        <Badge variant={s.variance === 0 ? "success" : Math.abs(s.variance) >= 500 ? "danger" : "warning"}>{s.variance === 0 ? "Balanced" : `${s.variance > 0 ? "+" : ""}${s.variance.toLocaleString()}`}</Badge>
                        {Math.abs(s.variance) >= 500 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog === "open"} onClose={() => setDialog(null)} title="Open shift" size="sm">
        <form onSubmit={doOpen} className="space-y-4">
          <p className="text-sm text-gray-500">Count the cash float in the drawer before you start selling.</p>
          <Input label="Opening cash (KES)" type="number" min="0" value={float} onChange={(e) => setFloat(e.target.value)} autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit">Open shift</Button></div>
        </form>
      </Dialog>

      <Dialog open={dialog === "close"} onClose={() => setDialog(null)} title="Close shift" size="sm">
        <form onSubmit={doClose} className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Expected in drawer</span><span className="font-semibold">{formatCurrency(expectedNow)}</span></div>
          </div>
          <Input label="Cash counted (KES)" type="number" min="0" value={counted} onChange={(e) => setCounted(e.target.value)} autoFocus />
          {counted !== "" && (
            <p className={`rounded-lg px-3 py-2 text-sm font-medium ${variance === 0 ? "bg-green-50 text-green-700" : Math.abs(variance) >= 500 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>
              {variance === 0 ? "The drawer balances." : variance < 0 ? `Short by ${formatCurrency(-variance)}` : `Over by ${formatCurrency(variance)}`}
            </p>
          )}
          {variance !== 0 && counted !== "" && <Textarea label="Explain the difference" value={notes} onChange={(e) => setNotes(e.target.value)} />}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit">Close shift</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
