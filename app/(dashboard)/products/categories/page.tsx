"use client"

import { useCallback, useEffect, useState } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { api, ApiError, errorMessage, listAll, type Page } from "@/lib/api/client"
import { clean } from "@/lib/api/mappers"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { CategoryDialog } from "@/components/pos/category-dialog"
import type { Category } from "@/lib/types"
import { Plus, Pencil, Trash2, Tags } from "lucide-react"

const PAGE_SIZE = 15

export default function CategoriesPage() {
  const all = useDataStore((s) => s.categories)
  const role = useAuthStore((s) => s.user?.role)
  const [denied, setDenied] = useState(false)
  const canEdit = can(role, "products.edit") && !denied

  const [rows, setRows] = useState<Category[] | null>(null)
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  const [editing, setEditing] = useState<Category | null | undefined>(undefined) // undefined = closed, null = new
  const [removing, setRemoving] = useState<Category | null>(null)
  const [inUse, setInUse] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  // Wait a moment after typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    api<Page<Category>>("/categories", { query: { page, limit: PAGE_SIZE, q, isActive: status } })
      .then((res) => {
        if (cancelled) return
        setRows(res.data.map((r) => clean<Category>(r)))
        setMeta({ total: res.meta.total, pages: res.meta.pages })
        setError("")
      })
      .catch((e) => { if (!cancelled) setError(errorMessage(e, "Could not load categories.")) })
    return () => { cancelled = true }
  }, [page, q, status, reloadKey])

  // Pickers elsewhere (product forms, parent select) read the full list from the store.
  const syncStore = async () => {
    try { useDataStore.getState().setCollection("categories", (await listAll<unknown>("/categories")).map((r) => clean<Category>(r))) } catch { /* the list on screen still reloads */ }
  }

  const saved = async (c: Category) => {
    notify.success(editing ? "Category updated" : "Category added", c.name)
    setEditing(undefined)
    await syncStore()
    reload()
  }

  const closeRemove = () => { setRemoving(null); setInUse(null) }

  const remove = async () => {
    if (!removing) return
    setBusy(true)
    try {
      await api(`/categories/${removing.id}`, { method: "DELETE" })
      notify.success("Category removed", removing.name)
      closeRemove()
      await syncStore()
      reload()
    } catch (e) {
      if (e instanceof ApiError && e.code === "IN_USE") {
        setInUse(Number(/(\d+)\s+product/.exec(e.message)?.[1] ?? 1))
      } else {
        if (e instanceof ApiError && e.code === "PERMISSION_DENIED") { setDenied(true); closeRemove() }
        notify.error("Could not remove the category", errorMessage(e))
      }
    }
    setBusy(false)
  }

  const deactivate = async () => {
    if (!removing) return
    setBusy(true)
    try {
      await api(`/categories/${removing.id}`, { method: "PATCH", body: { isActive: false } })
      notify.success("Category deactivated", removing.name)
      closeRemove()
      await syncStore()
      reload()
    } catch (e) {
      notify.error("Could not deactivate the category", errorMessage(e))
    }
    setBusy(false)
  }

  const parentName = (id?: string) => all.find((c) => c.id === id)?.name

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description={rows ? `${meta.total} ${meta.total === 1 ? "category" : "categories"}` : undefined}>
        {canEdit && <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add Category</Button>}
      </PageHeader>

      <Card><CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
        <SearchInput aria-label="Search categories" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-sm" />
        <div className="sm:w-44">
          <Select aria-label="Status" options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} placeholder="All statuses" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatus(e.target.value); setPage(1) }} />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {error ? (
          <div role="alert" className="p-8 text-center text-sm text-red-600">
            {error} <button className="underline" onClick={reload}>Try again</button>
          </div>
        ) : rows === null ? (
          <p role="status" className="p-8 text-center text-sm text-gray-500">Loading categories…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-12 w-12" />}
            title={q || status ? "No categories match" : "No categories yet"}
            description={q || status ? "Try a different search or filter." : "Categories group your products so they are easy to find at the till."}
            action={canEdit && !q && !status ? <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4" />Add Category</Button> : undefined}
          />
        ) : (
          <Table scroll>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Parent</TableHead><TableHead>Status</TableHead>{canEdit && <TableHead className="w-24"><span className="sr-only">Actions</span></TableHead>}</TableRow></TableHeader>
            <TableBody>{rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="max-w-xs truncate text-gray-500">{c.description || "-"}</TableCell>
                <TableCell className="text-gray-500">{parentName(c.parentId) ?? "-"}</TableCell>
                <TableCell><Badge variant={c.isActive ? "success" : "default"}>{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setRemoving(c)} aria-label={`Remove ${c.name}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
        {rows && meta.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
            <span>Page {page} of {meta.pages}</span>
            <span className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </span>
          </div>
        )}
      </CardContent></Card>

      <CategoryDialog open={editing !== undefined} category={editing} onClose={() => setEditing(undefined)} onSaved={saved} onDenied={() => { setDenied(true); setEditing(undefined) }} />

      <Dialog open={!!removing} onClose={() => !busy && closeRemove()} title="Remove category?" size="sm">
        {inUse === null ? (
          <p className="mb-4 text-sm text-gray-600">Remove <b>{removing?.name}</b>? It will no longer be offered when adding products.</p>
        ) : (
          <p role="alert" className="mb-4 text-sm text-gray-700">This category is used by {inUse} product(s). Deactivate it instead.</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={closeRemove}>Cancel</Button>
          {inUse === null
            ? <Button variant="danger" isLoading={busy} onClick={remove}>Remove</Button>
            : <Button isLoading={busy} onClick={deactivate}>Deactivate</Button>}
        </div>
      </Dialog>
    </div>
  )
}
