"use client"

import { useEffect, useState } from "react"
import {
  Store, Wrench, Globe, Utensils, Sparkles, HeartPulse, Fuel, Truck, Warehouse, GraduationCap, Ticket, Sprout, Building, Briefcase, Layers, Check,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils/cn"
import type { Industry, IndustryOption } from "@/lib/types"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  store: Store, wrench: Wrench, globe: Globe, utensils: Utensils, sparkles: Sparkles, "heart-pulse": HeartPulse, fuel: Fuel, truck: Truck,
  warehouse: Warehouse, "graduation-cap": GraduationCap, ticket: Ticket, sprout: Sprout, building: Building, briefcase: Briefcase, layers: Layers,
}

export const industryIcon = (name: string) => ICONS[name] ?? Layers

interface Props {
  value: Industry | ""
  onChange: (v: Industry) => void
  error?: string
}

/** The owner says what kind of business this is; that decides the tabs and roles in their portal. */
export function IndustryPicker({ value, onChange, error }: Props) {
  const [options, setOptions] = useState<IndustryOption[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    api<IndustryOption[]>("/industries", { public: true })
      .then((o) => { if (live) { setOptions(o); setFailed(false) } })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [attempt])

  const chosen = options?.find((o) => o.id === value)

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-gray-700">What kind of business do you run?</legend>
      <p className="mb-3 text-xs text-gray-500">This sets up the right tabs, staff roles and tools for you. You can change it later in Settings.</p>
      {failed && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load the list. <button type="button" className="font-semibold underline" onClick={() => { setFailed(false); setAttempt((a) => a + 1) }}>Try again</button>
        </p>
      )}
      {!options && !failed && <p className="text-sm text-gray-500" role="status">Loading…</p>}
      {options && (
        <div role="radiogroup" aria-label="Industry" className="grid gap-2 sm:grid-cols-2">
          {options.map((o) => {
            const Icon = industryIcon(o.icon)
            const selected = o.id === value
            return (
              <button
                key={o.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(o.id)}
                className={cn("flex items-start gap-3 rounded-xl border p-3 text-left transition-colors", selected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50")}
              >
                <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", selected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-900">{o.label}{selected && <Check className="h-4 w-4 text-blue-600" />}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{o.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
      {chosen && (
        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {chosen.roles.length > 0 && <p><span className="font-medium text-gray-800">Extra staff roles:</span> {chosen.roles.join(", ")}</p>}
          {chosen.recordTypes.length > 0 && <p><span className="font-medium text-gray-800">Extra tabs:</span> {chosen.recordTypes.join(", ")}{chosen.modules.includes("deliveries") ? ", Deliveries" : ""}{chosen.modules.includes("fleet") ? ", Fleet" : ""}</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </fieldset>
  )
}
