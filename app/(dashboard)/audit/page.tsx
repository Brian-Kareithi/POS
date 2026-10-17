"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useMemo, useState } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { ROLE_LABELS } from "@/lib/permissions"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/ui/search-input"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils/format"
import { exportCSV } from "@/lib/utils/export"
import type { AuditLog } from "@/lib/types"
import { AlertTriangle, Download, ShieldCheck, Users } from "lucide-react"

const SEVERITIES = [
  { id: "all", label: "Everything" },
  { id: "warning", label: "Needs attention" },
  { id: "critical", label: "Critical" },
] as const

const variant: Record<AuditLog["severity"], "default" | "warning" | "danger"> = { info: "default", warning: "warning", critical: "danger" }

export default function AuditLogPage() {
  const now = useNow()
  const logs = useDataStore((s) => s.auditLogs)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]["id"]>("all")
  const [person, setPerson] = useState("all")

  const people = useMemo(() => [...new Set(logs.map((l) => l.userName))].sort(), [logs])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return logs.filter((l) =>
      (severity === "all" || l.severity === severity) &&
      (person === "all" || l.userName === person) &&
      (!q || [l.action, l.detail, l.entity, l.userName].some((v) => v.toLowerCase().includes(q)))
    )
  }, [logs, search, severity, person])

  const weekAgo = now - 7 * 86400000
  const recent = useMemo(() => logs.filter((l) => new Date(l.createdAt).getTime() >= weekAgo), [logs, weekAgo])
  const flagged = recent.filter((l) => l.severity !== "info")

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; role: string; actions: number; flagged: number }>()
    recent.forEach((l) => {
      const row = map.get(l.userName) ?? { name: l.userName, role: l.role === "system" ? "System" : ROLE_LABELS[l.role], actions: 0, flagged: 0 }
      row.actions += 1
      if (l.severity !== "info") row.flagged += 1
      map.set(l.userName, row)
    })
    return [...map.values()].sort((a, b) => b.actions - a.actions)
  }, [recent])

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Who changed prices, adjusted stock, gave discounts, voided sales or issued refunds">
        <Button variant="secondary" onClick={() => exportCSV(filtered.map((l) => ({ When: new Date(l.createdAt).toLocaleString("en-KE"), Who: l.userName, Role: l.role, Action: l.action, Area: l.entity, Detail: l.detail, Severity: l.severity })), "audit-log")}><Download className="h-4 w-4" />Export CSV</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Actions, last 7 days" value={recent.length.toString()} icon={ShieldCheck} />
        <StatsCard title="Flagged for review" value={flagged.length.toString()} icon={AlertTriangle} changeType={flagged.length ? "negative" : "positive"} change={flagged.length ? "Refunds, voids, stock losses, big discounts" : "Nothing unusual"} />
        <StatsCard title="Active staff" value={byPerson.length.toString()} icon={Users} />
      </div>

      <Card><CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput placeholder="Search the log..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
          <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person" className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <option value="all">Everyone</option>
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {SEVERITIES.map((s) => (
              <button key={s.id} onClick={() => setSeverity(s.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${severity === s.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{s.label}</button>
            ))}
          </div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-gray-500">Nothing matches.</TableCell></TableRow>}
              {filtered.slice(0, 100).map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-gray-500">{formatDateTime(l.createdAt)}</TableCell>
                  <TableCell><span className="font-medium">{l.userName}</span><span className="block text-xs text-gray-400">{l.role === "system" ? "System" : ROLE_LABELS[l.role]}</span></TableCell>
                  <TableCell><Badge variant={variant[l.severity]}>{l.action}</Badge></TableCell>
                  <TableCell className="text-gray-600">{l.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>

        <Card><CardContent className="p-0">
          <p className="border-b border-gray-100 px-6 py-4 font-semibold text-gray-900">Staff activity, last 7 days</p>
          <Table>
            <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Actions</TableHead><TableHead>Flagged</TableHead></TableRow></TableHeader>
            <TableBody>
              {byPerson.map((p) => (
                <TableRow key={p.name}><TableCell><span className="font-medium">{p.name}</span><span className="block text-xs text-gray-400">{p.role}</span></TableCell><TableCell>{p.actions}</TableCell><TableCell>{p.flagged ? <Badge variant="warning">{p.flagged}</Badge> : "—"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </div>
    </div>
  )
}
