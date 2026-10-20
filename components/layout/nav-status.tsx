"use client"

import { Building2, Cloud, WifiOff } from "lucide-react"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { usePosStore } from "@/lib/stores/pos-store"
import { syncPendingSales } from "@/lib/services/checkout"

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

/** Shows connection state and how many offline sales are waiting to upload. Clicking toggles a test outage. */
export function ConnectionStatus() {
  const offlineMode = usePosStore((s) => s.offlineMode)
  const setOfflineMode = usePosStore((s) => s.setOfflineMode)
  const pending = usePosStore((s) => s.queue.length)

  const toggle = () => {
    if (offlineMode) {
      setOfflineMode(false)
      syncPendingSales()
    } else {
      setOfflineMode(true)
    }
  }

  return (
    <button
      onClick={toggle}
      title={offlineMode ? "Test offline mode is on. Click to reconnect and sync." : "Click to test offline selling"}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${offlineMode ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}
    >
      {offlineMode ? <WifiOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
      <span className="hidden sm:inline">{offlineMode ? "Offline" : "Synced"}</span>
      {pending > 0 && <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{pending}</span>}
    </button>
  )
}
