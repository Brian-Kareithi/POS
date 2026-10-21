"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Store, Wrench, Globe, Utensils, Sparkles, HeartPulse, Fuel, Truck, Warehouse, GraduationCap, Ticket, Sprout, Building, Briefcase, Layers, Check, ChevronDown, Search, X,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils/cn"
import type { Industry, IndustryOption } from "@/lib/types"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  store: Store, wrench: Wrench, globe: Globe, utensils: Utensils, sparkles: Sparkles, "heart-pulse": HeartPulse, fuel: Fuel, truck: Truck,
  warehouse: Warehouse, "graduation-cap": GraduationCap, ticket: Ticket, sprout: Sprout, building: Building, briefcase: Briefcase, layers: Layers,
}

export const industryIcon = (name: string) => ICONS[name] ?? Layers

/** Looks the icon up by name, so the component is not created during a parent's render. */
function IndustryIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICONS[name]) || Store
  return <Icon className={className} />
}

// Everyday words people use for their business, so "salon" or "pharmacy" finds the right industry without knowing our names for them.
const ALIASES: Partial<Record<Industry, string>> = {
  retail: "shop supermarket kiosk mini mart boutique store duka wholesale grocery mama mboga",
  hardware_building: "hardware construction cement paint plumbing electrical timber tools",
  ecommerce_omnichannel: "online shop website instagram jumia social media dropshipping delivery orders",
  hospitality: "restaurant cafe bar pub hotel lodge catering takeaway nyama choma kitchen guest house",
  beauty_wellness: "salon barber barbershop spa nails massage gym fitness kinyozi beauty hair",
  healthcare_pharmacy: "pharmacy chemist clinic dental optical lab hospital medicine doctor",
  fuel_automotive: "petrol station garage mechanic tyres car wash spare parts motor",
  logistics: "courier parcel delivery riders boda trucking freight transport shipping",
  warehousing_distribution: "wholesaler distributor warehouse supplier depot",
  education: "school college tuition nursery training church ngo fees",
  events_entertainment: "events tickets cinema club venue theatre theme park",
  agriculture: "farm agrovet produce cooperative crops livestock seeds fertiliser",
  property_rental: "landlord rent tenants apartments property manager coworking",
  professional_services: "repair cyber cafe printing tailor studio consultant freelancer services",
}

interface Props {
  value: Industry | ""
  onChange: (v: Industry) => void
  error?: string
}

/**
 * The owner says what kind of business this is; that decides the tabs and roles in their portal.
 * A closed field that opens a searchable list (a bottom sheet on phones), so nobody scrolls past fourteen cards to find theirs.
 */
export function IndustryPicker({ value, onChange, error }: Props) {
  const [options, setOptions] = useState<IndustryOption[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const search = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let live = true
    api<IndustryOption[]>("/industries", { public: true })
      .then((o) => { if (live) { setOptions(o); setFailed(false) } })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [attempt])

  const chosen = options?.find((o) => o.id === value)

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!options) return []
    if (!words.length) return options
    return options.filter((o) => {
      const hay = `${o.label} ${o.description} ${ALIASES[o.id] ?? ""}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [options, query])

  const close = () => { setOpen(false); setQuery(""); trigger.current?.focus() }
  const openSheet = () => { setCursor(0); setOpen(true) }
  const pick = (o: IndustryOption) => { onChange(o.id); close() }

  useEffect(() => {
    if (!open) return
    // Pop the keyboard up only where there is a real keyboard; on a phone the list is the point.
    if (window.matchMedia?.("(pointer: fine)").matches ?? true) search.current?.focus()
    const lock = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = lock }
  }, [open])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close() }
    else if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    else if (e.key === "Enter" && results[cursor]) { e.preventDefault(); pick(results[cursor]) }
  }

  return (
    <div>
      <label id="industry-label" className="mb-1.5 block text-sm font-medium text-gray-700">What kind of business do you run?</label>
      {failed && (
        <p role="alert" className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load the business types. Check your connection. <button type="button" className="font-semibold underline" onClick={() => { setFailed(false); setAttempt((a) => a + 1) }}>Try again</button>
        </p>
      )}

      <button
        ref={trigger} type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby="industry-label" disabled={!options}
        onClick={openSheet}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-wait disabled:bg-gray-50",
          error ? "border-red-500" : "border-gray-200 hover:border-blue-300",
        )}
      >
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", chosen ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500")}><IndustryIcon name={chosen?.icon} className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate font-medium", chosen ? "text-gray-900" : "text-gray-400")}>{chosen ? chosen.label : options ? "Choose your business type" : "Loading business types..."}</span>
          {chosen && <span className="block truncate text-xs text-gray-500">{chosen.description}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {chosen && (chosen.roles.length > 0 || chosen.recordTypes.length > 0) && (
        <div className="mt-2 rounded-xl bg-blue-50/70 px-3 py-2 text-xs text-gray-600">
          {chosen.roles.length > 0 && <p><span className="font-medium text-gray-800">Staff roles you get:</span> {chosen.roles.join(", ")}</p>}
          {chosen.recordTypes.length > 0 && <p><span className="font-medium text-gray-800">Extra tabs:</span> {chosen.recordTypes.join(", ")}{chosen.modules.includes("deliveries") ? ", Deliveries" : ""}{chosen.modules.includes("fleet") ? ", Fleet" : ""}</p>}
        </div>
      )}
      {error && <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}

      {open && options && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" onKeyDown={onKey}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} />
          <div role="dialog" aria-modal="true" aria-label="Choose your business type" className="relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-h-[32rem] sm:max-w-lg sm:rounded-[2rem]">
            <div className="flex items-center gap-2 px-4 pb-2 pt-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={search} value={query} onChange={(e) => { setQuery(e.target.value); setCursor(0) }} placeholder="Search: salon, pharmacy, school, garage..."
                  aria-label="Search business types" autoComplete="off" enterKeyHint="search"
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:text-sm"
                />
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <ul role="listbox" aria-label="Business types" className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
              {results.map((o, i) => {
                const selected = o.id === value
                return (
                  <li key={o.id} role="option" aria-selected={selected}>
                    <button
                      type="button" onClick={() => pick(o)} onMouseEnter={() => setCursor(i)}
                      className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors", i === cursor ? "bg-blue-50" : "hover:bg-gray-50")}
                    >
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", selected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}><IndustryIcon name={o.icon} className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">{o.label}</span>
                        <span className="line-clamp-2 text-xs text-gray-500">{o.description}</span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                    </button>
                  </li>
                )
              })}
              {results.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-gray-500">
                  Nothing matches &ldquo;{query}&rdquo;. Try a simpler word such as shop, restaurant, school or clinic.
                  <button type="button" onClick={() => setQuery("")} className="mt-3 block w-full font-semibold text-blue-700">Show all business types</button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
