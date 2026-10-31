"use client"

import { useEffect, useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { tabs, type Tab } from "@/lib/api/tabs"
import { formatCurrency } from "@/lib/utils/format"
import { Plus, Receipt } from "lucide-react"

interface Props {
  open: boolean
  /** Shown under the title, e.g. "3 items · KES 1,200.00 will be added". */
  summary?: string
  busy?: boolean
  onClose: () => void
  /** Either an existing tab or the name of a new one. */
  onChoose: (choice: { tab: Tab } | { label: string }) => void
}

const SUGGESTIONS = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6", "Bar", "Patio"]

/** Pick which tab an order goes on, or start a new one in a couple of taps. */
export function TabPickerDialog(props: Props) {
  return props.open ? <Picker {...props} /> : null
}

function Picker({ summary, busy, onClose, onChoose }: Props) {
  const [open, setOpen] = useState<Tab[] | null>(null)
  const [label, setLabel] = useState("")

  useEffect(() => {
    let live = true
    tabs.list("open").then((r) => { if (live) setOpen(r.data) }).catch(() => { if (live) setOpen([]) })
    return () => { live = false }
  }, [])

  const taken = new Set((open ?? []).map((t) => t.label.toLowerCase()))
  const free = SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase()))
  const clash = !!label.trim() && taken.has(label.trim().toLowerCase())

  return (
    <Dialog open onClose={busy ? () => {} : onClose} title="Put this order on a tab" size="md">
      <div className="space-y-5">
        {summary && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{summary}</p>}

        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (label.trim() && !clash) onChoose({ label: label.trim() }) }}>
          <Input label="New tab" placeholder="Table number or guest name" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} error={clash ? "That name already has an open tab. Pick it below." : undefined} autoFocus />
          {free.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {free.map((s) => (
                <button key={s} type="button" onClick={() => onChoose({ label: s })} disabled={busy} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">{s}</button>
              ))}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={!label.trim() || clash} isLoading={busy}><Plus />Open tab and add order</Button>
        </form>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Add to an open tab</h3>
          {open === null && <p className="py-4 text-center text-sm text-gray-400">Loading tabs…</p>}
          {open?.length === 0 && <p className="py-4 text-center text-sm text-gray-400">No open tabs yet.</p>}
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {open?.map((t) => (
              <li key={t.id}>
                <button onClick={() => onChoose({ tab: t })} disabled={busy || t.guestPaying} className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">
                  <span className="flex min-w-0 items-center gap-2"><Receipt className="h-4 w-4 shrink-0 text-gray-400" /><span className="min-w-0"><span className="block truncate text-sm font-medium text-gray-900">{t.label}</span><span className="block text-xs text-gray-500">{t.itemCount} item{t.itemCount === 1 ? "" : "s"}{t.guestPaying ? " · guest is paying" : ""}</span></span></span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(t.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  )
}
