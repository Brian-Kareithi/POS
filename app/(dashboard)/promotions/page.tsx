"use client"

import { useState } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { isoDate } from "@/lib/utils/analytics"
import type { Promotion } from "@/lib/types"
import { Plus } from "lucide-react"

const status = (p: Promotion): { label: string; variant: "success" | "warning" | "default" | "danger" } => {
  const now = Date.now()
  if (!p.isActive) return { label: "Off", variant: "default" }
  if (new Date(p.endsAt).getTime() < now) return { label: "Expired", variant: "danger" }
  if (new Date(p.startsAt).getTime() > now) return { label: "Scheduled", variant: "warning" }
  return { label: "Live", variant: "success" }
}

const blank = { name: "", code: "", type: "percent", value: "10", productId: "", startsAt: isoDate(new Date()), endsAt: isoDate(new Date(Date.now() + 14 * 86400000)) }

export default function PromotionsPage() {
  const { promotions, products, addPromotion, updatePromotion, logAudit } = useDataStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState("")

  const describe = (p: Promotion) =>
    p.type === "percent" ? `${p.value}% off the whole bill` : p.type === "fixed" ? `${formatCurrency(p.value)} off` : `Buy ${p.value}, get ${p.value} free · ${products.find((x) => x.id === p.productId)?.name ?? "selected product"}`

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(form.value)
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "-")
    if (!form.name.trim() || !code) return setError("Give the offer a name and a code.")
    if (promotions.some((p) => p.code === code)) return setError("That code is already in use.")
    if (!(value > 0) || (form.type === "percent" && value > 50)) return setError(form.type === "percent" ? "Choose a percentage between 1 and 50." : "Enter a value.")
    if (form.type === "bogo" && !form.productId) return setError("Choose the product for the offer.")
    if (form.endsAt < form.startsAt) return setError("The end date is before the start date.")
    const promo: Promotion = {
      id: generateId(), code, name: form.name.trim(), type: form.type as Promotion["type"], value: form.type === "bogo" ? 1 : value,
      productId: form.type === "bogo" ? form.productId : undefined, startsAt: new Date(form.startsAt + "T00:00:00").toISOString(),
      endsAt: new Date(form.endsAt + "T23:59:59").toISOString(), isActive: true, uses: 0,
    }
    addPromotion(promo)
    logAudit("Promotion created", "Promotion", `${promo.code}: ${describe(promo)}`)
    notify.success("Promotion created", `${promo.code} · ${describe(promo)}`)
    setOpen(false)
    setForm(blank)
    setError("")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Promotions" description="Codes cashiers can enter at the till. Schedule them ahead of time and switch them off any time.">
        <Button onClick={() => { setOpen(true); setError("") }}><Plus className="h-4 w-4" />New promotion</Button>
      </PageHeader>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Offer</TableHead><TableHead>Code</TableHead><TableHead>Runs</TableHead><TableHead>Used</TableHead><TableHead>Status</TableHead><TableHead>On</TableHead></TableRow></TableHeader>
          <TableBody>
            {promotions.map((p) => {
              const st = status(p)
              return (
                <TableRow key={p.id}>
                  <TableCell><span className="font-medium">{p.name}</span><span className="block text-xs text-gray-500">{describe(p)}</span></TableCell>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="text-gray-500">{formatDate(p.startsAt)} – {formatDate(p.endsAt)}</TableCell>
                  <TableCell>{p.uses}×</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell><Switch checked={p.isActive} onChange={(v: boolean) => { updatePromotion(p.id, { isActive: v }); logAudit(v ? "Promotion switched on" : "Promotion switched off", "Promotion", p.code) }} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="New promotion" size="md">
        <form onSubmit={create} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend special" autoFocus />
          <Input label="Code cashiers enter" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. WEEKEND10" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={[{ value: "percent", label: "Percentage off" }, { value: "fixed", label: "Fixed amount off" }, { value: "bogo", label: "Buy one, get one free" }]} value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, type: e.target.value })} />
            {form.type !== "bogo" && <Input label={form.type === "percent" ? "Percent (max 50)" : "Amount (KES)"} type="number" min="1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />}
          </div>
          {form.type === "bogo" && <Select label="Product" placeholder="Choose product" options={products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: p.name }))} value={form.productId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, productId: e.target.value })} />}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Starts" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            <Input label="Ends" type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
