"use client"

import { ListSkeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { adminApi, STATUS_LABELS, STATUS_VARIANT, when, type AdminBusinessRow } from "@/lib/api/admin"
import { errorMessage } from "@/lib/api/client"
import { PageHeader } from "@/components/ui/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const PAGE = 20

export default function AdminBusinessesPage() {
  const [q, setQ] = useState("")
  const [term, setTerm] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AdminBusinessRow[] | null>(null)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState("")

  // Search as people type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setTerm(q.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    let live = true
    setError("")
    adminApi.businesses({ q: term || undefined, status: status || undefined, page, limit: PAGE })
      .then((r) => { if (live) { setRows(r.data); setPages(r.meta.pages); setTotal(r.meta.total) } })
      .catch((e) => { if (live) { setRows([]); setError(errorMessage(e, "Could not load businesses.")) } })
    return () => { live = false }
  }, [term, status, page])

  return (
    <div>
      <PageHeader title="Businesses" description={rows ? `${total} ${total === 1 ? "business" : "businesses"}` : undefined} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search businesses" placeholder="Search by business name, owner name or owner email"
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Filter by status" className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
          <option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="closed">Closed</option>
        </select>
      </div>
      {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Card className="overflow-hidden rounded-2xl">
        <ul className="divide-y divide-gray-100">
          {rows?.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/businesses/${b.id}`} className="flex flex-col gap-1 px-5 py-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:gap-4">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="truncate font-semibold text-gray-900">{b.name}</span><Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABELS[b.status]}</Badge></span>
                  <span className="block truncate text-sm text-gray-600">{b.owner ? `${b.owner.name} · ${b.owner.email}` : "No owner account"}</span>
                  <span className="block text-xs text-gray-400">{b.industryLabel} · {b.staffCount} {b.staffCount === 1 ? "person" : "people"}</span>
                </span>
                <span className="text-xs text-gray-500 sm:text-right">Joined {when(b.createdAt)}<br />Last active {when(b.lastActiveAt)}</span>
              </Link>
            </li>
          ))}
          {rows && rows.length === 0 && !error && (
            <li className="px-5 py-12 text-center text-sm text-gray-500">{term || status ? "No business matches that search." : "No businesses have signed up yet."}</li>
          )}
          {!rows && <li><ListSkeleton rows={6} bordered={false} /></li>}
        </ul>
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" className="rounded-full" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="secondary" className="rounded-full" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
