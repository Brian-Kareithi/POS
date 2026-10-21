"use client"

import { useCallback, useEffect, useState } from "react"
import { api, errorMessage } from "@/lib/api/client"
import { deliveriesApi } from "@/lib/api/deliveries"
import { can } from "@/lib/permissions"
import { useAuthStore } from "@/lib/stores/auth-store"
import { formatDate } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import type { Vehicle, VehicleStatus, VehicleType } from "@/lib/types"
import { AlertTriangle, Car, Plus } from "lucide-react"

const TYPES: { value: VehicleType; label: string }[] = [
  { value: "bicycle", label: "Bicycle" }, { value: "motorbike", label: "Motorbike" }, { value: "tuk_tuk", label: "Tuk-tuk" }, { value: "car", label: "Car" },
  { value: "van", label: "Van" }, { value: "pickup", label: "Pickup" }, { value: "truck", label: "Truck" }, { value: "lorry", label: "Lorry" }, { value: "other", label: "Other" },
]
const STATUS: Record<VehicleStatus, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  available: { label: "Available", variant: "success" }, on_trip: { label: "On a trip", variant: "warning" },
  maintenance: { label: "In the workshop", variant: "danger" }, retired: { label: "Retired", variant: "default" },
}

export default function FleetPage() {
  const me = useAuthStore((s) => s.user)
  const manage = can(me?.role, "fleet.manage")
  const [rows, setRows] = useState<Vehicle[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Vehicle | "new" | null>(null)

  const load = useCallback(async () => {
    try { setRows(await deliveriesApi.vehicles()); setError("") } catch (e) { setError(errorMessage(e, "Could not load vehicles.")) } finally { setLoading(false) }
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when the page opens
  useEffect(() => { void load() }, [load])

  const setStatus = async (v: Vehicle, status: "available" | "maintenance") => {
    try { await api(`/vehicles/${v.id}`, { method: "PATCH", body: { status } }); notify.success(status === "maintenance" ? `${v.plate} is in the workshop` : `${v.plate} is back on the road`); void load() } catch (e) { notify.error("That didn't work", errorMessage(e)) }
  }
  const retire = async (v: Vehicle) => {
    if (!window.confirm(`Retire ${v.plate}? It stays in the history but can no longer be used.`)) return
    try { await api(`/vehicles/${v.id}`, { method: "DELETE" }); notify.success(`${v.plate} retired`); void load() } catch (e) { notify.error("That didn't work", errorMessage(e)) }
  }

  const alerts = rows.filter((v) => v.insuranceStatus !== "ok" || v.inspectionStatus !== "ok")

  return (
    <div className="space-y-6">
      <PageHeader title="Fleet" description="Vehicles, who can use them, and when their insurance and inspection run out">
        {manage && <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" />Add vehicle</Button>}
      </PageHeader>

      {alerts.length > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{alerts.map((v) => `${v.plate}: ${[v.insuranceStatus !== "ok" && `insurance ${v.insuranceStatus === "expired" ? "expired" : "expires soon"}`, v.inspectionStatus !== "ok" && `inspection ${v.inspectionStatus === "expired" ? "expired" : "due soon"}`].filter(Boolean).join(", ")}`).join(" · ")}</span>
        </div>
      )}

      <Card><CardContent className="p-0">
        {error ? <p role="alert" className="py-10 text-center text-sm text-red-600">{error}</p>
          : loading ? <p className="py-10 text-center text-sm text-gray-500" role="status">Loading…</p>
          : rows.length === 0 ? <EmptyState icon={<Car className="h-10 w-10" />} title="No vehicles yet" description={manage ? "Add the vans, trucks and bikes you deliver with." : undefined} />
          : (
            <ul className="divide-y divide-gray-100">
              {rows.map((v) => (
                <li key={v.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium text-gray-900">{v.plate}<span className="font-normal text-gray-500">{v.name ? `${v.name} · ` : ""}{TYPES.find((t) => t.value === v.type)?.label}{v.capacityKg ? ` · ${v.capacityKg.toLocaleString()} kg` : ""}</span><Badge variant={STATUS[v.status].variant}>{STATUS[v.status].label}</Badge></p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Insurance {v.insuranceExpiry ? <span className={v.insuranceStatus !== "ok" ? "font-semibold text-red-600" : ""}>{formatDate(v.insuranceExpiry)}</span> : "not recorded"} ·
                      Inspection {v.inspectionExpiry ? <span className={v.inspectionStatus !== "ok" ? "font-semibold text-red-600" : ""}>{formatDate(v.inspectionExpiry)}</span> : "not recorded"} · {v.openDeliveries} open delivery(ies)
                    </p>
                  </div>
                  {manage && (
                    <span className="flex flex-wrap gap-2">
                      {v.status === "maintenance" ? <Button size="sm" variant="secondary" onClick={() => setStatus(v, "available")}>Back on the road</Button>
                        : v.status === "available" ? <Button size="sm" variant="secondary" onClick={() => setStatus(v, "maintenance")}>Send to workshop</Button> : null}
                      <Button size="sm" variant="secondary" onClick={() => setEditing(v)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => retire(v)}>Retire</Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
      </CardContent></Card>

      {editing && <VehicleDialog vehicle={editing === "new" ? null : editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); void load() }} />}
    </div>
  )
}

const day = (iso?: string) => (iso ? iso.slice(0, 10) : "")

function VehicleDialog({ vehicle, onClose, onDone }: { vehicle: Vehicle | null; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ plate: vehicle?.plate ?? "", name: vehicle?.name ?? "", type: vehicle?.type ?? "van", capacityKg: vehicle?.capacityKg ? String(vehicle.capacityKg) : "", insuranceExpiry: day(vehicle?.insuranceExpiry), inspectionExpiry: day(vehicle?.inspectionExpiry) })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (f.plate.trim().length < 2) return setError("Enter the number plate.")
    const cap = f.capacityKg.trim() === "" ? undefined : Math.floor(Number(f.capacityKg))
    if (cap !== undefined && !(cap > 0)) return setError("Capacity must be a positive number of kilograms.")
    setBusy(true)
    try {
      const body = {
        plate: f.plate.trim(), type: f.type, ...(f.name.trim() ? { name: f.name.trim() } : {}), ...(cap ? { capacityKg: cap } : {}),
        ...(f.insuranceExpiry ? { insuranceExpiry: f.insuranceExpiry } : vehicle ? { insuranceExpiry: null } : {}),
        ...(f.inspectionExpiry ? { inspectionExpiry: f.inspectionExpiry } : vehicle ? { inspectionExpiry: null } : {}),
      }
      await api(vehicle ? `/vehicles/${vehicle.id}` : "/vehicles", { method: vehicle ? "PATCH" : "POST", body })
      notify.success(vehicle ? "Vehicle updated" : "Vehicle added")
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }
  return (
    <Dialog open onClose={onClose} title={vehicle ? `Edit ${vehicle.plate}` : "Add vehicle"} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Number plate" value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} autoFocus />
          <Select label="Type" options={TYPES} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as VehicleType })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nickname (optional)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="Capacity (kg)" type="number" min={1} value={f.capacityKg} onChange={(e) => setF({ ...f, capacityKg: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Insurance expires" type="date" value={f.insuranceExpiry} onChange={(e) => setF({ ...f, insuranceExpiry: e.target.value })} />
          <Input label="Inspection due" type="date" value={f.inspectionExpiry} onChange={(e) => setF({ ...f, inspectionExpiry: e.target.value })} />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>Save</Button></div>
      </form>
    </Dialog>
  )
}
