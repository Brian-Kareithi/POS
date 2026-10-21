"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { adminApi, when, type AdminActivityRow, type AdminAuditRow } from "@/lib/api/admin"
import { errorMessage } from "@/lib/api/client"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ListSkeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"

type View = "mine" | "businesses"

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between">
      <Button variant="secondary" className="rounded-full" disabled={page <= 1} onClick={() => onPage(page - 1)}>Newer</Button>
      <span className="text-sm text-gray-500">Page {page} of {pages}</span>
      <Button variant="secondary" className="rounded-full" disabled={page >= pages} onClick={() => onPage(page + 1)}>Older</Button>
    </div>
  )
}

/** What the super admin has done. */
function MyActions() {
  const [rows, setRows] = useState<AdminAuditRow[] | null>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [error, setError] = useState("")

  useEffect(() => {
    let live = true
    adminApi.audit({ page, limit: 30 })
      .then((r) => { if (live) { setRows(r.data); setPages(r.meta.pages) } })
      .catch((e) => { if (live) { setRows([]); setError(errorMessage(e, "Could not load your activity.")) } })
    return () => { live = false }
  }, [page])

  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!rows ? <ListSkeleton rows={6} /> : (
        <Card className="overflow-hidden rounded-2xl">
          <ul className="divide-y divide-gray-100">
            {rows.map((a) => (
              <li key={a.id} className="px-4 py-3.5 text-sm sm:px-5">
                <p className="break-words"><span className="font-semibold text-gray-900">{a.action}</span> <span className="text-gray-600">{a.detail}</span></p>
                <p className="text-xs text-gray-400">{a.adminEmail} · {when(a.createdAt)}{a.businessId && <> · <Link href={`/admin/businesses/${a.businessId}`} className="text-blue-600 hover:underline">view business</Link></>}</p>
              </li>
            ))}
            {rows.length === 0 && !error && <li className="px-5 py-12 text-center text-sm text-gray-500">You have not done anything yet.</li>}
          </ul>
        </Card>
      )}
      <Pager page={page} pages={pages} onPage={setPage} />
    </>
  )
}

const SEVERITY = { info: "default", warning: "warning", critical: "danger" } as const

/** What people did inside every business (each business's own audit log), across all of them. */
function BusinessActivity() {
  const [rows, setRows] = useState<AdminActivityRow[] | null>(null)
  const [q, setQ] = useState("")
  const [term, setTerm] = useState("")
  const [severity, setSeverity] = useState("")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    const t = setTimeout(() => { setTerm(q.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let live = true
    adminApi.activity({ page, limit: 30, q: term || undefined, severity: severity || undefined })
      .then((r) => { if (live) { setRows(r.data); setPages(r.meta.pages); setTotal(r.meta.total) } })
      .catch((e) => { if (live) { setRows([]); setError(errorMessage(e, "Could not load business activity.")) } })
    return () => { live = false }
  }, [page, term, severity])

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search activity" placeholder="Search by action, person or detail" className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }} aria-label="Filter by importance" className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All importance</option><option value="info">Routine</option><option value="warning">Warnings</option><option value="critical">Critical</option>
        </select>
      </div>
      {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!rows ? <ListSkeleton rows={6} /> : (
        <Card className="overflow-hidden rounded-2xl">
          <ul className="divide-y divide-gray-100">
            {rows.map((a) => (
              <li key={a.id} className="px-4 py-3.5 text-sm sm:px-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-gray-900">{a.action}</span>
                  {a.severity !== "info" && <Badge variant={SEVERITY[a.severity]}>{a.severity}</Badge>}
                </div>
                <p className="break-words text-gray-600">{a.detail}</p>
                <p className="text-xs text-gray-400">
                  {a.userName} ({a.role}) · <Link href={`/admin/businesses/${a.businessId}`} className={cn("hover:underline", a.businessName.startsWith("(") ? "pointer-events-none" : "text-blue-600")}>{a.businessName}</Link> · {when(a.createdAt)}
                </p>
              </li>
            ))}
            {rows.length === 0 && !error && <li className="px-5 py-12 text-center text-sm text-gray-500">{term || severity ? "Nothing matches that search." : "Nothing has been logged in any business yet."}</li>}
          </ul>
        </Card>
      )}
      {rows && total > 0 && <p className="mt-2 text-xs text-gray-400">{total.toLocaleString()} entries</p>}
      <Pager page={page} pages={pages} onPage={setPage} />
    </>
  )
}

export default function AdminActivityPage() {
  const [view, setView] = useState<View>("businesses")
  return (
    <div className="min-w-0">
      <PageHeader title="Activity" description="What is happening on the platform. Businesses cannot see your own log." />
      <div role="tablist" className="mb-4 inline-grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium">
        {([["businesses", "Business activity"], ["mine", "My actions"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={cn("rounded-full px-4 py-2 transition-colors", view === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>{label}</button>
        ))}
      </div>
      {view === "mine" ? <MyActions /> : <BusinessActivity />}
    </div>
  )
}
