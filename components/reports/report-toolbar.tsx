"use client"

import { useMemo, useState } from "react"
import { useNow } from "@/lib/hooks/use-now"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { exportCSV, exportExcel, printPage, type Row } from "@/lib/utils/export"
import { isoDate, type Range } from "@/lib/utils/analytics"
import { Building2, Download, FileSpreadsheet, FileText } from "lucide-react"

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "month", label: "This month" },
  { id: "lastmonth", label: "Last month" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom" },
] as const

export type PresetId = (typeof PRESETS)[number]["id"]

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function useReportRange(initial: PresetId = "30d") {
  const nowMs = useNow()
  const [preset, setPreset] = useState<PresetId>(initial)
  const [from, setFrom] = useState(() => isoDate(new Date(nowMs - 29 * 86400000)))
  const [to, setTo] = useState(() => isoDate(new Date(nowMs)))

  const { range, previous, label } = useMemo(() => {
    const now = new Date(nowMs)
    const today = startOfDay(now)
    let start = today
    let end = new Date(today.getTime() + 86400000 - 1)
    switch (preset) {
      case "7d": start = new Date(today.getTime() - 6 * 86400000); break
      case "30d": start = new Date(today.getTime() - 29 * 86400000); break
      case "month": start = new Date(now.getFullYear(), now.getMonth(), 1); break
      case "lastmonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case "year": start = new Date(now.getFullYear(), 0, 1); break
      case "custom": {
        start = new Date(from + "T00:00:00")
        end = new Date(to + "T23:59:59")
        break
      }
    }
    const length = end.getTime() - start.getTime()
    const range: Range = { start, end }
    const previous: Range = { start: new Date(start.getTime() - length - 1000), end: new Date(start.getTime() - 1000) }
    const fmt = (d: Date) => d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
    return { range, previous, label: `${fmt(start)} – ${fmt(end)}` }
  }, [preset, from, to, nowMs])

  return { preset, setPreset, from, setFrom, to, setTo, range, previous, label }
}

interface ToolbarProps {
  state: ReturnType<typeof useReportRange>
  branchLabel: string
  /** Rows to export. Leave out to hide the export buttons. */
  rows?: () => Row[]
  filename: string
}

export function ReportToolbar({ state, branchLabel, rows, filename }: ToolbarProps) {
  const canExport = can(useAuthStore((s) => s.user?.role), "reports.export")
  return (
    <div className="no-print space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => state.setPreset(p.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${state.preset === p.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p.label}</button>
        ))}
        {state.preset === "custom" && (
          <span className="flex items-center gap-2 text-sm">
            <input type="date" value={state.from} max={state.to} onChange={(e) => state.setFrom(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm" aria-label="From" />
            to
            <input type="date" value={state.to} min={state.from} onChange={(e) => state.setTo(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm" aria-label="To" />
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-gray-500"><Building2 className="h-4 w-4" />{branchLabel} · {state.label}</p>
        {canExport && (
          <div className="flex gap-2">
            {rows && <Button size="sm" variant="secondary" onClick={() => exportCSV(rows(), filename)}><Download className="h-3.5 w-3.5" />CSV</Button>}
            {rows && <Button size="sm" variant="secondary" onClick={() => exportExcel(rows(), filename)}><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>}
            <Button size="sm" variant="secondary" onClick={printPage}><FileText className="h-3.5 w-3.5" />PDF</Button>
          </div>
        )}
      </div>
    </div>
  )
}
