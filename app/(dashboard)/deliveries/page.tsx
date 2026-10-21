"use client"

import { ListSkeleton } from "@/components/ui/skeleton"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { deliveriesApi, DELIVERY_STATUS } from "@/lib/api/deliveries"
import { errorMessage } from "@/lib/api/client"
import { can } from "@/lib/permissions"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import type { Delivery, Rider, Vehicle } from "@/lib/types"
import { AlertTriangle, Bike, MapPin, Package, Phone, Plus, Truck, Wallet } from "lucide-react"

type View = "open" | "done" | "issues"

export default function DeliveriesPage() {
  const me = useAuthStore((s) => s.user)
  const runs = can(me?.role, "deliveries.manage")
  const sees = runs || can(me?.role, "deliveries.view")
  const [view, setView] = useState<View>("open")
  const [rows, setRows] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState<Delivery | null>(null)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof deliveriesApi.summary>> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = view === "open" ? { open: "true" } : view === "issues" ? { discrepancy: "true" } : { open: "false" }
      setRows((await deliveriesApi.list(query)).data)
      setError("")
      if (sees) setStats(await deliveriesApi.summary().catch(() => null))
    } catch (e) {
      setError(errorMessage(e, "Could not load deliveries."))
    } finally {
      setLoading(false)
    }
  }, [view, sees])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when the page opens
  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-6">
      <PageHeader title={sees ? "Deliveries" : "My deliveries"} description={sees ? "Every load that leaves, who carries it, and whether everything arrived" : "The deliveries given to you. Open one to confirm the load and hand it over."}>
        {runs && <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New delivery</Button>}
      </PageHeader>

      {sees && stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard title="Open now" value={String(stats.open)} icon={Truck} />
          <StatsCard title="Delivered (30 days)" value={String(stats.byStatus.delivered ?? 0)} icon={Package} />
          <StatsCard title="With a discrepancy" value={String(stats.discrepancies)} icon={AlertTriangle} changeType={stats.discrepancies ? "negative" : "neutral"} change={stats.discrepancies ? "Missing items or cash differences" : "All clear"} />
          <StatsCard title="Cash on delivery" value={formatCurrency(stats.cod.collected)} icon={Wallet} change={`${formatCurrency(stats.cod.owed)} due`} changeType={stats.cod.collected < stats.cod.owed ? "negative" : "neutral"} />
        </div>
      )}

      {sees && stats && stats.riders.length > 0 && (
        <Card><CardContent>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Riders, last 30 days</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Rider</th><th>Given</th><th>Delivered</th><th>Failed</th><th>Discrepancies</th><th>Avg trip</th><th>Cash collected / due</th></tr></thead>
            <tbody>{stats.riders.map((r) => (
              <tr key={r.riderId} className="border-t border-gray-100"><td className="py-2 font-medium">{r.name}</td><td>{r.assigned}</td><td>{r.delivered}</td><td>{r.failed}</td>
                <td>{r.discrepancies ? <Badge variant="danger">{r.discrepancies}</Badge> : "0"}</td><td>{r.avgMinutes != null ? `${r.avgMinutes} min` : "-"}</td>
                <td className={r.cod.collected < r.cod.owed ? "text-red-600" : ""}>{formatCurrency(r.cod.collected)} / {formatCurrency(r.cod.owed)}</td></tr>
            ))}</tbody>
          </table></div>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-0">
        <div className="px-4 pt-3 sm:px-6">
          <Tabs tabs={[{ id: "open", label: "Open" }, { id: "done", label: "Finished" }, ...(sees ? [{ id: "issues", label: "Discrepancies" }] : [])]} activeTab={view} onTabChange={(t) => setView(t as View)} />
        </div>
        {error ? <p role="alert" className="py-10 text-center text-sm text-red-600">{error}</p>
          : loading ? <ListSkeleton rows={5} bordered={false} />
          : rows.length === 0 ? <EmptyState icon={<Truck className="h-10 w-10" />} title={view === "open" ? "Nothing on the road" : "Nothing here"} description={runs && view === "open" ? "Create a delivery, then give it to a rider." : undefined} />
          : (
            <ul className="divide-y divide-gray-100">
              {rows.map((d) => (
                <li key={d.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <Link href={`/deliveries/${d.id}`} className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-gray-900">
                      {d.number} · {d.recipientName}
                      <Badge variant={DELIVERY_STATUS[d.status].variant}>{DELIVERY_STATUS[d.status].label}</Badge>
                      {d.priority === "urgent" && <Badge variant="danger">Urgent</Badge>}
                      {d.hasDiscrepancy && <Badge variant="danger">Discrepancy</Badge>}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.address}</span>
                      {d.recipientPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{d.recipientPhone}</span>}
                      <span>{d.items.length} item line(s)</span>
                      {d.codAmount ? <span>Collect {formatCurrency(d.codAmount)}</span> : null}
                      {d.rider && <span className="flex items-center gap-1"><Bike className="h-3 w-3" />{d.rider.name}{d.vehicle ? ` · ${d.vehicle.plate}` : ""}</span>}
                      <span>{formatDateTime(d.createdAt)}</span>
                    </p>
                  </Link>
                  {runs && (d.status === "pending" || d.status === "assigned") && (
                    <Button size="sm" variant="secondary" onClick={() => setAssigning(d)}>{d.status === "pending" ? "Assign" : "Reassign"}</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
      </CardContent></Card>

      {creating && <CreateDialog onClose={() => setCreating(false)} onDone={() => { setCreating(false); void load() }} />}
      {assigning && <AssignDialog delivery={assigning} onClose={() => setAssigning(null)} onDone={() => { setAssigning(null); void load() }} />}
    </div>
  )
}

function useDispatchOptions() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const industry = useDataStore((s) => s.industry)
  const hasFleet = industry?.modules.includes("fleet") ?? false
  useEffect(() => {
    deliveriesApi.riders().then(setRiders).catch(() => setRiders([]))
    if (hasFleet) deliveriesApi.vehicles().then((v) => setVehicles(v.filter((x) => x.status === "available" || x.status === "on_trip"))).catch(() => setVehicles([]))
  }, [hasFleet])
  return { riders, vehicles, hasFleet }
}

function RiderFields({ riderId, vehicleId, setRiderId, setVehicleId }: { riderId: string; vehicleId: string; setRiderId: (v: string) => void; setVehicleId: (v: string) => void }) {
  const { riders, vehicles, hasFleet } = useDispatchOptions()
  return (
    <>
      <Select label="Rider / driver" placeholder="Choose later" options={riders.map((r) => ({ value: r.id, label: `${r.name} (${r.openDeliveries} open)` }))} value={riderId} onChange={(e) => setRiderId(e.target.value)} />
      {riders.length === 0 && <p className="-mt-2 text-xs text-amber-700">No riders yet. Add staff with the Rider or Driver role under Staff.</p>}
      {hasFleet && <Select label="Vehicle" placeholder="No vehicle" options={vehicles.map((v) => ({ value: v.id, label: `${v.plate} · ${v.type}${v.status === "on_trip" ? " (on a trip)" : ""}` }))} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={!riderId} />}
    </>
  )
}

function AssignDialog({ delivery, onClose, onDone }: { delivery: Delivery; onClose: () => void; onDone: () => void }) {
  const [riderId, setRiderId] = useState(delivery.riderId ?? "")
  const [vehicleId, setVehicleId] = useState(delivery.vehicleId ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!riderId) return setError("Pick who will carry it.")
    setBusy(true)
    try {
      await deliveriesApi.assign(delivery.id, { riderId, vehicleId: vehicleId || null })
      notify.success("Delivery assigned", delivery.number)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }
  return (
    <Dialog open onClose={onClose} title={`Assign ${delivery.number}`} size="md">
      <form onSubmit={submit} className="space-y-4">
        <RiderFields riderId={riderId} vehicleId={vehicleId} setRiderId={setRiderId} setVehicleId={setVehicleId} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>Assign</Button></div>
      </form>
    </Dialog>
  )
}

interface Line { productId: string; name: string; quantity: string }

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const products = useDataStore((s) => s.products)
  const [form, setForm] = useState({ recipientName: "", recipientPhone: "", address: "", notes: "", priority: "normal", codAmount: "", riderId: "", vehicleId: "" })
  const [lines, setLines] = useState<Line[]>([{ productId: "", name: "", quantity: "1" }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recipientName.trim() || !form.address.trim()) return setError("Say who it is for and where it is going.")
    const items = lines.filter((l) => l.productId || l.name.trim()).map((l) => ({ ...(l.productId ? { productId: l.productId } : {}), ...(l.name.trim() ? { name: l.name.trim() } : {}), quantity: Math.floor(Number(l.quantity)) }))
    if (items.length === 0 || items.some((i) => !(i.quantity > 0))) return setError("List what is being delivered, with a quantity for each.")
    const cod = form.codAmount.trim() === "" ? undefined : Number(form.codAmount)
    if (cod !== undefined && (!Number.isFinite(cod) || cod < 0)) return setError("Cash to collect must be a positive number.")
    setBusy(true)
    try {
      const d = await deliveriesApi.create({
        recipientName: form.recipientName.trim(), address: form.address.trim(), priority: form.priority, items,
        ...(form.recipientPhone.trim() ? { recipientPhone: form.recipientPhone.trim() } : {}), ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        ...(cod !== undefined ? { codAmount: cod } : {}), ...(form.riderId ? { riderId: form.riderId } : {}), ...(form.riderId && form.vehicleId ? { vehicleId: form.vehicleId } : {}),
      })
      notify.success("Delivery created", d.number)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title="New delivery" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Deliver to" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} autoFocus />
          <Input label="Phone" type="tel" value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} />
        </div>
        <Input label="Address / directions" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">What is being delivered</p>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_5rem_auto] items-end gap-2">
                <div className="space-y-1">
                  <select aria-label="Product" value={l.productId} onChange={(e) => setLine(i, { productId: e.target.value, name: "" })} className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                    <option value="">Something else (type below)</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {!l.productId && <input aria-label="Item name" placeholder="Describe the item" value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />}
                </div>
                <input aria-label="Quantity" type="number" min={1} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))} className="pb-2 text-xs text-red-600 hover:underline">Remove</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines((ls) => [...ls, { productId: "", name: "", quantity: "1" }])} className="mt-2 text-xs font-medium text-blue-600 hover:underline">+ Add another item</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Cash to collect on delivery (KES)" type="number" min={0} value={form.codAmount} onChange={(e) => setForm({ ...form, codAmount: e.target.value })} />
          <Select label="Priority" options={[{ value: "normal", label: "Normal" }, { value: "urgent", label: "Urgent" }]} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        </div>
        <RiderFields riderId={form.riderId} vehicleId={form.vehicleId} setRiderId={(v) => setForm((f) => ({ ...f, riderId: v, vehicleId: v ? f.vehicleId : "" }))} setVehicleId={(v) => setForm((f) => ({ ...f, vehicleId: v }))} />
        <Textarea label="Notes for the rider" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={busy}>Create delivery</Button></div>
      </form>
    </Dialog>
  )
}
