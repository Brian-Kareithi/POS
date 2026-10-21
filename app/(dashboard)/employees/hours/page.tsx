"use client"

import { useCallback, useEffect, useState } from "react"
import { api, errorMessage, type Page } from "@/lib/api/client"
import { can, ROLE_LABELS } from "@/lib/permissions"
import { useAuthStore } from "@/lib/stores/auth-store"
import { formatDateTime, formatMinutes } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import type { HoursPerson, HoursReport, WorkSession } from "@/lib/types"
import { AlertTriangle, Coffee, Timer, Users } from "lucide-react"

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d) }

export default function HoursPage() {
  const me = useAuthStore((s) => s.user)
  const all = can(me?.role, "hours.view")
  const [from, setFrom] = useState(daysAgo(6))
  const [to, setTo] = useState(ymd(new Date()))
  const [report, setReport] = useState<HoursReport | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [who, setWho] = useState<{ id: string; name: string } | null>(null)

  const load = useCallback(async () => {
    if (!all) { setLoading(false); return }
    setLoading(true)
    try { setReport(await api<HoursReport>("/time/report", { query: { from, to } })); setError("") } catch (e) { setError(errorMessage(e, "Could not load hours.")) } finally { setLoading(false) }
  }, [all, from, to])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when the page opens
  useEffect(() => { void load() }, [load])

  if (!all) return <MySessions />

  const people = report?.people ?? []
  const working = people.filter((p) => p.openNow).length

  return (
    <div className="space-y-6">
      <PageHeader title="Hours worked" description="Time on the clock minus breaks, for every member of staff">
        <Input aria-label="From" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        <Input aria-label="To" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Hours worked, all staff" value={formatMinutes(report?.totals.workedMinutes ?? 0)} icon={Timer} />
        <StatsCard title="Break time" value={formatMinutes(report?.totals.breakMinutes ?? 0)} icon={Coffee} />
        <StatsCard title="At work right now" value={String(working)} icon={Users} change={report?.totals.needsReview ? `${report.totals.needsReview} session(s) need a correction` : undefined} changeType="negative" />
      </div>

      <Card><CardContent className="p-0">
        {error ? <p role="alert" className="py-10 text-center text-sm text-red-600">{error}</p>
          : loading ? <p className="py-10 text-center text-sm text-gray-500" role="status">Loading…</p>
          : people.length === 0 ? <EmptyState icon={<Timer className="h-10 w-10" />} title="No staff yet" />
          : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500"><th className="px-4 py-3">Staff</th><th>Days worked</th><th>Hours worked</th><th>Per day</th><th>Breaks</th><th>Sessions</th><th>Now</th><th className="pr-4"><span className="sr-only">Details</span></th></tr></thead>
              <tbody>{people.map((p) => <Row key={p.userId} p={p} onOpen={() => setWho({ id: p.userId, name: p.name })} />)}</tbody>
            </table></div>
          )}
      </CardContent></Card>

      <p className="text-xs text-gray-500">A session left open for more than {report?.maxSessionHours ?? 16} hours is never counted beyond that and is flagged, because it is almost always a forgotten clock-out.</p>
      {who && <SessionsDialog person={who} from={from} to={to} canFix={can(me?.role, "hours.manage")} onClose={() => setWho(null)} onChanged={() => void load()} />}
    </div>
  )
}

function Row({ p, onOpen }: { p: HoursPerson; onOpen: () => void }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3"><span className="font-medium">{p.name}</span><span className="block text-xs text-gray-400">{ROLE_LABELS[p.role]}</span></td>
      <td>{p.daysWorked}</td>
      <td className="font-semibold">{formatMinutes(p.workedMinutes)}</td>
      <td>{p.daysWorked ? formatMinutes(p.avgMinutesPerDay) : "-"}</td>
      <td>{formatMinutes(p.breakMinutes)}</td>
      <td>{p.sessions}{p.needsReview > 0 && <Badge variant="danger" className="ml-2">{p.needsReview} to fix</Badge>}</td>
      <td>{p.onBreakNow ? <Badge variant="warning">On break</Badge> : p.openNow ? <Badge variant="success">Working</Badge> : <span className="text-gray-400">-</span>}</td>
      <td className="pr-4"><button onClick={onOpen} className="text-xs font-medium text-blue-600 hover:underline" aria-label={`Sessions of ${p.name}`}>Sessions</button></td>
    </tr>
  )
}

function useSessions(userId: string | undefined, from: string, to: string) {
  const [rows, setRows] = useState<WorkSession[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try {
      const res = await api<Page<WorkSession>>("/time/sessions", { query: { limit: 200, from, to, ...(userId ? { userId } : {}) } })
      setRows(res.data); setError("")
    } catch (e) { setError(errorMessage(e, "Could not load sessions.")) } finally { setLoading(false) }
  }, [userId, from, to])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when the page opens
  useEffect(() => { void load() }, [load])
  return { rows, error, loading, reload: load }
}

function SessionList({ rows, canFix, onFix }: { rows: WorkSession[]; canFix: boolean; onFix: (s: WorkSession) => void }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-gray-500">No sessions in this period.</p>
  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
          <div>
            <p className="font-medium">{formatDateTime(s.clockInAt)} → {s.clockOutAt ? formatDateTime(s.clockOutAt) : <span className="text-green-700">still clocked in</span>}</p>
            <p className="text-xs text-gray-500">
              {formatMinutes(s.workedMinutes)} worked{s.breakMinutes ? ` · ${formatMinutes(s.breakMinutes)} break` : ""} · {s.source === "shift" ? "from till shift" : "clocked manually"}
              {s.adjustedNote && <span className="text-amber-700"> · corrected: {s.adjustedNote}</span>}
            </p>
            {(s.stale || s.autoClosed) && <p className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" />{s.autoClosed ? "Closed automatically after being left open" : "Open too long: probably forgot to clock out"}</p>}
          </div>
          {canFix && <Button size="sm" variant="secondary" onClick={() => onFix(s)}>Correct</Button>}
        </li>
      ))}
    </ul>
  )
}

function SessionsDialog({ person, from, to, canFix, onClose, onChanged }: { person: { id: string; name: string }; from: string; to: string; canFix: boolean; onClose: () => void; onChanged: () => void }) {
  const { rows, error, loading, reload } = useSessions(person.id, from, to)
  const [fixing, setFixing] = useState<WorkSession | null>(null)
  return (
    <Dialog open onClose={onClose} title={`${person.name}: sessions`} size="lg">
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : loading ? <p className="text-sm text-gray-500">Loading…</p> : <SessionList rows={rows} canFix={canFix} onFix={setFixing} />}
      {fixing && <FixDialog session={fixing} onClose={() => setFixing(null)} onDone={() => { setFixing(null); void reload(); onChanged() }} />}
    </Dialog>
  )
}

const toLocal = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "")

function FixDialog({ session, onClose, onDone }: { session: WorkSession; onClose: () => void; onDone: () => void }) {
  const [inAt, setInAt] = useState(toLocal(session.clockInAt))
  const [outAt, setOutAt] = useState(toLocal(session.clockOutAt))
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (note.trim().length < 3) return setError("Say why you are changing this.")
    if (session.open && !outAt) return setError("Enter when they actually finished.")
    setBusy(true)
    try {
      await api(`/time/sessions/${session.id}`, { method: "PATCH", body: { clockInAt: new Date(inAt).toISOString(), ...(outAt ? { clockOutAt: new Date(outAt).toISOString() } : {}), note: note.trim() } })
      notify.success("Hours corrected")
      onDone()
    } catch (err) { setError(errorMessage(err)); setBusy(false) }
  }
  return (
    <Dialog open onClose={onClose} title="Correct this session" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Clocked in" type="datetime-local" value={inAt} onChange={(e) => setInAt(e.target.value)} />
        <Input label="Clocked out" type="datetime-local" value={outAt} onChange={(e) => setOutAt(e.target.value)} />
        <Input label="Reason" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Forgot to clock out" />
        <p className="text-xs text-gray-500">Corrections are recorded in the audit log with your name and reason.</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>Save</Button></div>
      </form>
    </Dialog>
  )
}

function MySessions() {
  const [from] = useState(daysAgo(13))
  const [to] = useState(ymd(new Date()))
  const { rows, error, loading } = useSessions(undefined, from, to)
  const total = rows.reduce((s, r) => s + r.workedMinutes, 0)
  return (
    <div className="space-y-6">
      <PageHeader title="My hours" description="Your clocked time for the last two weeks, breaks not counted" />
      <StatsCard title="Hours worked, last 14 days" value={formatMinutes(total)} icon={Timer} />
      <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900">Sessions</h3></CardHeader><CardContent>
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : loading ? <p className="text-sm text-gray-500">Loading…</p> : <SessionList rows={rows} canFix={false} onFix={() => {}} />}
      </CardContent></Card>
    </div>
  )
}
