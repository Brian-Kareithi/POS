"use client"

import { useState } from "react"
import { Building2, Cloud, CloudOff, Loader2, RefreshCw, WifiOff, AlertTriangle } from "lucide-react"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { useOnline } from "@/lib/hooks/use-online"
import { usePosStore } from "@/lib/stores/pos-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { syncPendingSales } from "@/lib/services/checkout"
import { refresh } from "@/lib/api/sync"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"

export function BranchSwitcher() {
  const { branchId, setBranchId, allowAll, branches } = useBranchFilter()
  if (!allowAll || branches.length < 2) return null
  return (
    <label className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-600 md:flex">
      <Building2 className="h-4 w-4 text-gray-400" />
      <select value={branchId} onChange={(e) => setBranchId(e.target.value)} aria-label="Branch" className="bg-transparent text-sm font-medium text-gray-700 outline-none">
        <option value="all">All branches</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </label>
  )
}

/**
 * Connection state and the offline sales waiting to upload. Opening it shows each queued sale, lets a person upload now,
 * retry one the server refused, or (after reading why) discard it.
 */
export function ConnectionStatus() {
  const online = useOnline()
  const me = useAuthStore((s) => s.user)
  const queue = usePosStore((s) => s.queue)
  const offlineMode = usePosStore((s) => s.offlineMode)
  const setOfflineMode = usePosStore((s) => s.setOfflineMode)
  const snapshotAt = useDataStore((s) => s.offlineSnapshotAt)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const mine = queue.filter((q) => !q.userId || q.userId === me?.id)
  const others = queue.length - mine.length
  const attention = mine.filter((q) => q.status === "needs_attention")
  const waiting = mine.length - attention.length

  const syncNow = async () => {
    setBusy(true)
    try {
      await syncPendingSales()
    } finally {
      setBusy(false)
    }
  }
  const reconnect = () => {
    setOfflineMode(false)
    void syncNow()
  }

  const tone = !online ? "bg-orange-50 text-orange-700" : attention.length ? "bg-red-50 text-red-700" : waiting ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
  const label = !online ? "Offline" : attention.length ? "Needs attention" : waiting ? "Syncing" : "Synced"

  return (
    <>
      <button onClick={() => setOpen(true)} title="Connection and offline sales" className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${tone}`}>
        {!online ? <WifiOff className="h-4 w-4" /> : attention.length ? <AlertTriangle className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
        <span className="hidden sm:inline">{label}</span>
        {mine.length > 0 && <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{mine.length}</span>}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Connection and offline sales" size="lg">
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm text-gray-600">
            {online ? <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> : <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />}
            {online
              ? "You are online. Sales made while the connection was down upload by themselves, oldest first."
              : "You are offline. You can keep selling: sales are saved on this device and upload as soon as the connection is back."}
          </p>
          {snapshotAt && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Showing products and customers saved on this device at {formatDateTime(snapshotAt)}. They refresh when you are back online.</p>}
          {others > 0 && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">{others} sale(s) from another person who used this device are waiting. They upload when that person signs in.</p>}

          {mine.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">Nothing is waiting to upload.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {mine.map((q) => (
                <li key={q.idempotencyKey} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{q.sale ? formatCurrency(q.sale.total) : "Sale"} <span className="font-normal text-gray-500">· {formatDateTime(q.occurredAt)}</span></p>
                    {q.status === "needs_attention"
                      ? <p className="text-xs text-red-600">Refused: {q.error?.message}</p>
                      : <p className="text-xs text-gray-500">Waiting to upload{q.attempts ? ` · tried ${q.attempts} time(s)` : ""}</p>}
                  </div>
                  {q.status === "needs_attention" && (
                    <span className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => { usePosStore.getState().retry(q.idempotencyKey); void syncNow() }}>Retry</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        if (window.confirm("Discard this sale? It will NOT be recorded anywhere and the stock and money will not be updated. Only do this if it was entered by mistake.")) {
                          usePosStore.getState().dequeue([q.idempotencyKey])
                          void refresh.sales()
                        }
                      }}>Discard</Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input type="checkbox" checked={offlineMode} onChange={(e) => (e.target.checked ? setOfflineMode(true) : reconnect())} />
              Pretend the connection is down (for training)
            </label>
            <Button onClick={syncNow} disabled={busy || !online || waiting === 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Upload now
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
