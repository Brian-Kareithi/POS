"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api, errorMessage, type Page } from "@/lib/api/client"
import { can } from "@/lib/permissions"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { SearchInput } from "@/components/ui/search-input"
import { EmptyState } from "@/components/ui/empty-state"
import type { FieldDef, IndustryRecord, RecordTypeDef, Tone } from "@/lib/types"
import { ClipboardList, Plus } from "lucide-react"

const TONE: Record<Tone, "default" | "success" | "warning" | "danger" | "info"> = { neutral: "default", info: "info", success: "success", warning: "warning", danger: "danger" }
type View = "open" | "closed" | "all"

/**
 * One page for every industry-specific list (appointments, prescriptions, work orders, reservations, students, events...).
 * What it shows is driven entirely by the record type the server describes for this business.
 */
export default function RecordsPage() {
  const { type } = useParams<{ type: string }>()
  const def = useDataStore((s) => s.industry?.recordTypes.find((r) => r.key === type))
  if (!def) return <p className="py-10 text-center text-sm text-gray-500">This page is not part of your business setup.</p>
  return <RecordList key={def.key} def={def} />
}

function RecordList({ def }: { def: RecordTypeDef }) {
  const me = useAuthStore((s) => s.user)
  const manage = can(me?.role, "records.manage")
  const [view, setView] = useState<View>("open")
  const [q, setQ] = useState("")
  const [rows, setRows] = useState<IndustryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<IndustryRecord | "new" | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await api<Page<IndustryRecord>>("/records", { query: { type: def.key, limit: 100, ...(view !== "all" ? { open: view === "open" ? "true" : "false" } : {}), ...(q.trim() ? { q: q.trim() } : {}) } })
      setRows(res.data); setError("")
    } catch (e) { setError(errorMessage(e, "Could not load this list.")) } finally { setLoading(false) }
  }, [def.key, view, q])
  useEffect(() => { const t = setTimeout(() => void load(), q ? 250 : 0); return () => clearTimeout(t) }, [load, q])

  const status = (key: string) => def.statuses.find((s) => s.key === key)
  const move = async (r: IndustryRecord, next: string) => {
    try { await api(`/records/${r.id}`, { method: "PATCH", body: { status: next } }); void load() } catch (e) { notify.error("That didn't work", errorMessage(e)) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={def.plural} description={def.description}>
        {manage && <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" />New {def.label.toLowerCase()}</Button>}
      </PageHeader>
      <Card><CardContent className="p-0">
        <div className="flex flex-col gap-3 px-4 pt-3 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <Tabs tabs={[{ id: "open", label: "Open" }, { id: "closed", label: "Finished" }, { id: "all", label: "All" }]} activeTab={view} onTabChange={(t) => setView(t as View)} />
          <div className="pb-2"><SearchInput placeholder={`Search ${def.plural.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        {error ? <p role="alert" className="py-10 text-center text-sm text-red-600">{error}</p>
          : loading ? <p className="py-10 text-center text-sm text-gray-500" role="status">Loading…</p>
          : rows.length === 0 ? <EmptyState icon={<ClipboardList className="h-10 w-10" />} title={`No ${def.plural.toLowerCase()} here`} />
          : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => {
                const st = status(r.status)
                return (
                  <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <button onClick={() => manage && setEditing(r)} className="min-w-0 flex-1 text-left">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-gray-900">{r.title}<span className="text-xs font-normal text-gray-400">{r.number}</span><Badge variant={TONE[st?.tone ?? "neutral"]}>{st?.label ?? r.status}</Badge></p>
                      <p className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-gray-500">
                        {r.scheduledAt && def.scheduled && <span>{def.scheduled.label}: {def.scheduled.kind === "date" ? formatDate(r.scheduledAt) : formatDateTime(r.scheduledAt)}</span>}
                        {r.customer && <span>{r.customer.name}</span>}
                        {r.assigneeName && def.assignee && <span>{def.assignee.label}: {r.assigneeName}</span>}
                        {r.amount != null && def.amount && <span>{def.amount.label}: {formatCurrency(r.amount)}</span>}
                      </p>
                    </button>
                    {manage && (
                      <select aria-label={`Status of ${r.title}`} value={r.status} onChange={(e) => move(r, e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm">
                        {def.statuses.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
      </CardContent></Card>
      {editing && <RecordDialog def={def} record={editing === "new" ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load() }} />}
    </div>
  )
}

function FieldInput({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const label = f.label + (f.required ? "" : " (optional)")
  const str = value == null ? "" : String(value)
  if (f.kind === "textarea") return <Textarea label={label} value={str} onChange={(e) => onChange(e.target.value)} rows={3} />
  if (f.kind === "select") return <Select label={label} placeholder="Choose" options={(f.options ?? []).map((o) => ({ value: o, label: o }))} value={str} onChange={(e) => onChange(e.target.value)} />
  if (f.kind === "boolean") return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />{f.label}</label>
  const type = f.kind === "number" || f.kind === "money" ? "number" : f.kind === "date" ? "date" : f.kind === "datetime" ? "datetime-local" : f.kind === "phone" ? "tel" : "text"
  return <Input label={label} type={type} min={f.kind === "money" ? 0 : undefined} step={f.kind === "money" ? "0.01" : undefined} value={str} placeholder={f.placeholder} onChange={(e) => onChange(f.kind === "number" || f.kind === "money" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />
}

/** Local "2026-03-01T14:30" <-> ISO, for datetime-local inputs. */
const toLocalInput = (iso?: string, kind?: "date" | "datetime") => {
  if (!iso) return ""
  const d = new Date(iso)
  if (kind === "date") return iso.slice(0, 10)
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

function RecordDialog({ def, record, onClose, onDone }: { def: RecordTypeDef; record: IndustryRecord | null; onClose: () => void; onDone: () => void }) {
  const customers = useDataStore((s) => s.customers)
  const users = useDataStore((s) => s.users)
  const employees = useDataStore((s) => s.employees)
  const [data, setData] = useState<Record<string, unknown>>(record?.data ?? {})
  const [status, setStatus] = useState(record?.status ?? def.statuses[0]!.key)
  const [when, setWhen] = useState(toLocalInput(record?.scheduledAt, def.scheduled?.kind))
  const [amount, setAmount] = useState(record?.amount != null ? String(record.amount) : "")
  const [customerId, setCustomerId] = useState(record?.customerId ?? "")
  const [assigneeId, setAssigneeId] = useState(record?.assigneeId ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const people = useMemo(() => {
    if (!def.assignee) return []
    const roles = new Set<string>(["owner", "manager", ...def.assignee.roles])
    return employees.filter((e) => e.isActive && e.approval !== "pending" && e.approval !== "rejected" && roles.has(e.role)).map((e) => ({ value: e.userId, label: users.find((u) => u.id === e.userId)?.name ?? "Staff" }))
  }, [def.assignee, employees, users])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    for (const f of def.fields) if (f.required && (data[f.key] == null || String(data[f.key]).trim() === "")) return setError(`${f.label} is required.`)
    if (def.scheduled?.required && !when) return setError(`${def.scheduled.label} is required.`)
    const money = amount.trim() === "" ? null : Number(amount)
    if (money !== null && (!Number.isFinite(money) || money < 0)) return setError(`${def.amount?.label ?? "Amount"} must be a positive number.`)
    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== "" && v != null))
    const body = {
      data: cleaned, status,
      ...(def.scheduled ? { scheduledAt: when ? (def.scheduled.kind === "date" ? new Date(`${when}T00:00:00`).toISOString() : new Date(when).toISOString()) : null } : {}),
      ...(def.amount ? { amount: money } : {}),
      ...(def.customer ? { customerId: customerId || null } : {}),
      ...(def.assignee ? { assigneeId: assigneeId || null } : {}),
    }
    setBusy(true)
    try {
      await api(record ? `/records/${record.id}` : "/records", { method: record ? "PATCH" : "POST", body: record ? body : { type: def.key, ...body } })
      notify.success(record ? `${def.label} updated` : `${def.label} created`)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title={record ? `${def.label} ${record.number}` : `New ${def.label.toLowerCase()}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {def.fields.map((f) => <div key={f.key} className={f.kind === "textarea" ? "sm:col-span-2" : ""}><FieldInput f={f} value={data[f.key]} onChange={(v) => setData({ ...data, [f.key]: v })} /></div>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {def.scheduled && <Input label={def.scheduled.label + (def.scheduled.required ? "" : " (optional)")} type={def.scheduled.kind === "date" ? "date" : "datetime-local"} value={when} onChange={(e) => setWhen(e.target.value)} />}
          {def.amount && <Input label={`${def.amount.label} (KES, optional)`} type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />}
          {def.customer && <Select label="Customer (optional)" placeholder="Walk-in / none" options={customers.map((c) => ({ value: c.id, label: c.name }))} value={customerId} onChange={(e) => setCustomerId(e.target.value)} />}
          {def.assignee && <Select label={def.assignee.label + " (optional)"} placeholder="Unassigned" options={people} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} />}
          <Select label="Status" options={def.statuses.map((s) => ({ value: s.key, label: s.label }))} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>Save</Button></div>
      </form>
    </Dialog>
  )
}
