"use client"

import { useEffect } from "react"
import { Building2, Cloud, WifiOff } from "lucide-react"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { useDataStore } from "@/lib/stores/data-store"
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

/** Shows connection state. Clicking toggles a simulated outage so offline selling can be demonstrated. */
export function ConnectionStatus() {
  const offlineMode = usePosStore((s) => s.offlineMode)
  const setOfflineMode = usePosStore((s) => s.setOfflineMode)
  const pending = useDataStore((s) => s.sales.filter((x) => x.synced === false).length)

  useEffect(() => {
    const online = () => syncPendingSales()
    window.addEventListener("online", online)
    return () => window.removeEventListener("online", online)
  }, [])

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
      title={offlineMode ? "Offline demo on. Click to reconnect and sync." : "Click to simulate losing internet"}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${offlineMode ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}
    >
      {offlineMode ? <WifiOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
      <span className="hidden sm:inline">{offlineMode ? "Offline" : "Synced"}</span>
      {pending > 0 && <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{pending}</span>}
    </button>
  )
}
