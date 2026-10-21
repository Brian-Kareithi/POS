"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { deliveriesApi, DELIVERY_STATUS } from "@/lib/api/deliveries"
import { errorMessage } from "@/lib/api/client"
import { can } from "@/lib/permissions"
import { useAuthStore } from "@/lib/stores/auth-store"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog } from "@/components/ui/dialog"
import type { Delivery } from "@/lib/types"
import { AlertTriangle, ArrowLeft, Bike, CheckCircle2, MapPin, Phone, Wallet } from "lucide-react"

type Mode = "load" | "handover" | "fail" | "cancel" | null

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const me = useAuthStore((s) => s.user)
  const [d, setD] = useState<Delivery | null>(null)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<Mode>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try { setD(await deliveriesApi.get(id)); setError("") } catch (e) { setError(errorMessage(e, "Could not load this delivery.")) }
  }, [id])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when the page opens
  useEffect(() => { void load() }, [load])

  const act = async (fn: () => Promise<Delivery>, ok: string) => {
    setBusy(true)
    try { setD(await fn()); notify.success(ok); await load(); return true } catch (e) { notify.error("That didn't work", errorMessage(e)); return false } finally { setBusy(false) }
  }

  if (error) return <p role="alert" className="py-10 text-center text-sm text-red-600">{error} <Link href="/deliveries" className="underline">Back to deliveries</Link></p>
  if (!d) return <p className="py-10 text-center text-sm text-gray-500" role="status">Loading…</p>

  const s = DELIVERY_STATUS[d.status]
  const runs = can(me?.role, "deliveries.manage")
  const loader = runs || can(me?.role, "deliveries.load") || d.riderId === me?.id
  const mine = runs || d.riderId === me?.id

  return (
    <div className="space-y-6">
      <Link href="/deliveries" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft className="h-4 w-4" />Deliveries</Link>
      <PageHeader title={`${d.number} · ${d.recipientName}`} description={d.address}>
        <Badge variant={s.variant}>{s.label}</Badge>
        {d.priority === "urgent" && <Badge variant="danger">Urgent</Badge>}
        {d.hasDiscrepancy && <Badge variant="danger">Discrepancy</Badge>}
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {d.status === "assigned" && loader && <Button onClick={() => setMode("load")}><CheckCircle2 className="h-4 w-4" />Confirm what is loaded</Button>}
        {d.status === "loaded" && mine && <Button isLoading={busy} onClick={() => act(() => deliveriesApi.start(d.id), "On the way")}><Bike className="h-4 w-4" />Start trip</Button>}
        {d.status === "in_transit" && mine && <Button onClick={() => setMode("handover")}><CheckCircle2 className="h-4 w-4" />Hand over</Button>}
        {["assigned", "loaded", "in_transit"].includes(d.status) && mine && <Button variant="secondary" onClick={() => setMode("fail")}>Could not deliver</Button>}
        {d.status === "failed" && (runs || can(me?.role, "deliveries.load")) && <Button isLoading={busy} onClick={() => act(() => deliveriesApi.markReturned(d.id), "Goods signed back in")}>Goods are back at the depot</Button>}
        {["pending", "assigned", "loaded"].includes(d.status) && runs && <Button variant="danger" onClick={() => setMode("cancel")}>Cancel delivery</Button>}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Manifest: nothing goes missing without a record</h3></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500"><th className="px-4 py-2">Item</th><th>Ordered</th><th>Loaded</th><th>Handed over</th><th className="pr-4">Why short</th></tr></thead>
              <tbody>{d.items.map((i) => {
                const shortLoad = i.loadedQty != null && i.loadedQty < i.quantity
                const shortHand = i.deliveredQty != null && i.deliveredQty < (i.loadedQty ?? i.quantity)
                return (
                  <tr key={i.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{i.name}</td><td>{i.quantity}</td>
                    <td className={shortLoad ? "font-semibold text-red-600" : ""}>{i.loadedQty ?? "-"}</td>
                    <td className={shortHand ? "font-semibold text-red-600" : ""}>{i.deliveredQty ?? "-"}</td>
                    <td className="pr-4 text-xs text-red-600">{i.shortfallReason ?? ""}</td>
                  </tr>
                )
              })}</tbody>
            </table></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Trip</h3></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" />{d.address}</p>
            {d.recipientPhone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /><a className="text-blue-600" href={`tel:${d.recipientPhone}`}>{d.recipientPhone}</a></p>}
            <p className="flex items-center gap-2"><Bike className="h-4 w-4 text-gray-400" />{d.rider ? `${d.rider.name}${d.vehicle ? ` · ${d.vehicle.plate}` : ""}` : "Not assigned yet"}</p>
            {d.codAmount ? <p className="flex items-center gap-2"><Wallet className="h-4 w-4 text-gray-400" />Collect {formatCurrency(d.codAmount)}{d.codCollected != null ? ` · collected ${formatCurrency(d.codCollected)}` : ""}</p> : null}
            {d.receivedBy && <p>Received by <span className="font-medium">{d.receivedBy}</span></p>}
            {d.notes && <p className="rounded-lg bg-gray-50 p-2 text-gray-600">{d.notes}</p>}
            {d.closedReason && <p className="rounded-lg bg-red-50 p-2 text-red-700">{d.closedReason}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">History</h3></CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {(d.events ?? []).map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                <span><span className="font-medium capitalize">{e.type.replace("_", " ")}</span> <span className="text-gray-500">· {e.userName} · {formatDateTime(e.createdAt)}</span><span className={`block ${/SHORT|PROBLEMS/.test(e.detail) ? "text-red-600" : "text-gray-600"}`}>{e.detail}</span></span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {mode === "load" && <CountDialog title="Confirm what is loaded" verb="loaded" d={d} onClose={() => setMode(null)} onSubmit={(items) => act(() => deliveriesApi.load(d.id, items.map((i) => ({ itemId: i.itemId, loadedQty: i.qty, reason: i.reason }))), "Load confirmed").then((ok) => ok && setMode(null))} />}
      {mode === "handover" && <HandoverDialog d={d} onClose={() => setMode(null)} onSubmit={(body) => act(() => deliveriesApi.complete(d.id, body), "Delivered").then((ok) => ok && setMode(null))} />}
      {(mode === "fail" || mode === "cancel") && (
        <ReasonDialog title={mode === "fail" ? "Why could it not be delivered?" : "Why is it cancelled?"} onClose={() => setMode(null)}
          onSubmit={(reason) => act(() => (mode === "fail" ? deliveriesApi.fail(d.id, reason) : deliveriesApi.cancel(d.id, reason)), mode === "fail" ? "Marked as failed" : "Cancelled").then((ok) => ok && setMode(null))} />
      )}
    </div>
  )
}

function ReasonDialog({ title, onClose, onSubmit }: { title: string; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("")
  return (
    <Dialog open onClose={onClose} title={title} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); if (reason.trim().length >= 3) onSubmit(reason.trim()) }} className="space-y-4">
        <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoFocus />
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Back</Button><Button type="submit" disabled={reason.trim().length < 3}>Save</Button></div>
      </form>
    </Dialog>
  )
}

interface Counted { itemId: string; qty: number; reason?: string }

/** One row per item: the quantity actually counted. Anything below what is expected needs a reason. */
function CountDialog({ title, verb, d, onClose, onSubmit }: { title: string; verb: string; d: Delivery; onClose: () => void; onSubmit: (items: Counted[]) => void }) {
  const [qty, setQty] = useState<Record<string, string>>(() => Object.fromEntries(d.items.map((i) => [i.id, String(i.quantity)])))
  const [why, setWhy] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const out: Counted[] = []
    for (const i of d.items) {
      const n = Number(qty[i.id])
      if (!Number.isInteger(n) || n < 0 || n > i.quantity) return setError(`${i.name}: enter a whole number from 0 to ${i.quantity}.`)
      if (n < i.quantity && !(why[i.id] ?? "").trim()) return setError(`${i.name}: only ${n} of ${i.quantity} ${verb}. Say why.`)
      out.push({ itemId: i.id, qty: n, reason: n < i.quantity ? why[i.id]!.trim() : undefined })
    }
    onSubmit(out)
  }
  return (
    <Dialog open onClose={onClose} title={title} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">Count each item. If the number is lower than ordered, say what happened. The dispatcher is alerted to anything short.</p>
        {d.items.map((i) => {
          const n = Number(qty[i.id])
          const short = Number.isFinite(n) && n < i.quantity
          return (
            <div key={i.id} className="rounded-lg border border-gray-200 p-3">
              <div className="grid grid-cols-[1fr_6rem] items-center gap-3">
                <p className="text-sm font-medium">{i.name} <span className="font-normal text-gray-500">· ordered {i.quantity}</span></p>
                <input aria-label={`${i.name} ${verb}`} type="number" min={0} max={i.quantity} value={qty[i.id]} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              {short && <input aria-label={`Why ${i.name} is short`} placeholder="Why is it short?" value={why[i.id] ?? ""} onChange={(e) => setWhy({ ...why, [i.id]: e.target.value })} className="mt-2 block w-full rounded-lg border border-red-200 px-3 py-2 text-sm" />}
            </div>
          )
        })}
        {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Confirm</Button></div>
      </form>
    </Dialog>
  )
}

function HandoverDialog({ d, onClose, onSubmit }: { d: Delivery; onClose: () => void; onSubmit: (b: { receivedBy: string; items: { itemId: string; deliveredQty: number; reason?: string }[]; codCollected?: number; note?: string }) => void }) {
  const [receivedBy, setReceivedBy] = useState(d.recipientName)
  const [qty, setQty] = useState<Record<string, string>>(() => Object.fromEntries(d.items.map((i) => [i.id, String(i.loadedQty ?? 0)])))
  const [why, setWhy] = useState<Record<string, string>>({})
  const [cod, setCod] = useState(d.codAmount ? String(d.codAmount) : "")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receivedBy.trim()) return setError("Who received it?")
    const items = []
    for (const i of d.items) {
      const onBoard = i.loadedQty ?? 0
      const n = Number(qty[i.id])
      if (!Number.isInteger(n) || n < 0 || n > onBoard) return setError(`${i.name}: enter a whole number from 0 to ${onBoard} (what was loaded).`)
      if (n < onBoard && !(why[i.id] ?? "").trim()) return setError(`${i.name}: ${onBoard - n} did not reach the recipient. Say why.`)
      items.push({ itemId: i.id, deliveredQty: n, ...(n < onBoard ? { reason: why[i.id]!.trim() } : {}) })
    }
    let codCollected: number | undefined
    if (d.codAmount) {
      codCollected = Number(cod)
      if (cod.trim() === "" || !Number.isFinite(codCollected) || codCollected < 0) return setError("Enter the cash you collected (0 if none).")
      if (Math.abs(codCollected - d.codAmount) > 0.005 && !note.trim()) return setError(`You collected ${formatCurrency(codCollected)} but ${formatCurrency(d.codAmount)} was due. Explain the difference in the note.`)
    }
    onSubmit({ receivedBy: receivedBy.trim(), items, ...(codCollected !== undefined ? { codCollected } : {}), ...(note.trim() ? { note: note.trim() } : {}) })
  }
  return (
    <Dialog open onClose={onClose} title="Hand over" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Received by" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
        {d.items.map((i) => {
          const onBoard = i.loadedQty ?? 0
          const short = Number(qty[i.id]) < onBoard
          return (
            <div key={i.id} className="rounded-lg border border-gray-200 p-3">
              <div className="grid grid-cols-[1fr_6rem] items-center gap-3">
                <p className="text-sm font-medium">{i.name} <span className="font-normal text-gray-500">· loaded {onBoard}</span></p>
                <input aria-label={`${i.name} handed over`} type="number" min={0} max={onBoard} value={qty[i.id]} onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })} className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              {short && <input aria-label={`Why ${i.name} is short`} placeholder="Why did some not arrive?" value={why[i.id] ?? ""} onChange={(e) => setWhy({ ...why, [i.id]: e.target.value })} className="mt-2 block w-full rounded-lg border border-red-200 px-3 py-2 text-sm" />}
            </div>
          )
        })}
        {d.codAmount ? <Input label={`Cash collected (KES ${d.codAmount.toLocaleString()} due)`} type="number" min={0} value={cod} onChange={(e) => setCod(e.target.value)} /> : null}
        <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Complete delivery</Button></div>
      </form>
    </Dialog>
  )
}
