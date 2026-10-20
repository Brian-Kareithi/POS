"use client"

import { useState } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { api, errorMessage } from "@/lib/api/client"
import { clean } from "@/lib/api/mappers"
import { notify } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils/format"
import type { Coupon } from "@/lib/types"
import { Copy, Plus, Ticket } from "lucide-react"

interface Usage {
  code: string
  uses: number
  usageLimit: number | null
  totalDiscounted: number
  sales: { id: string; receiptNumber: string; discountTotal: number; total: number; status: string; cashier: string | null; createdAt: string }[]
}

const describe = (c: Coupon) => (c.type === "percent" ? `${c.value}% off the total` : `${formatCurrency(c.value)} off`)

const status = (c: Coupon): { label: string; variant: "success" | "warning" | "default" | "danger" } => {
  if (!c.isActive) return { label: "Off", variant: "default" }
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { label: "Expired", variant: "danger" }
  if (c.usageLimit && c.uses >= c.usageLimit) return { label: "Used up", variant: "warning" }
  return { label: "Live", variant: "success" }
}

const blank = { type: "percent", value: "10", code: "", minSpend: "", usageLimit: "", expiresAt: "" }

async function copy(code: string) {
  try {
    await navigator.clipboard.writeText(code)
    notify.success("Copied", code)
  } catch {
    notify.info("Copy this code", code)
  }
}

/** Owner-issued discount codes: hand them out, a cashier types one in at the till and the percentage comes off the bill. */
export function DiscountCodesPanel() {
  const codes = useDataStore((s) => s.coupons)
  const loaded = useDataStore((s) => s.loaded)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [usage, setUsage] = useState<Usage | null>(null)

  const toggle = async (c: Coupon, isActive: boolean) => {
    try {
      const saved = clean<Coupon>(await api(`/coupons/${c.id}`, { method: "PATCH", body: { isActive } }))
      useDataStore.getState().upsert("coupons", saved)
    } catch (e) {
      notify.error("Could not change the code", errorMessage(e))
    }
  }

  const showUsage = async (c: Coupon) => {
    try {
      setUsage(await api<Usage>(`/coupons/${c.id}/usage`))
    } catch (e) {
      notify.error("Could not load usage", errorMessage(e))
    }
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(form.value)
    const code = form.code.trim().toUpperCase().replace(/\s+/g, "-")
    if (!(value > 0)) return setError("Enter how much the code takes off.")
    if (form.type === "percent" && value > 100) return setError("A percentage cannot be more than 100.")
    if (code && !/^[A-Z0-9_-]{3,40}$/.test(code)) return setError("Codes are 3 to 40 letters, numbers, - or _.")
    const minSpend = form.minSpend ? parseFloat(form.minSpend) : null
    const usageLimit = form.usageLimit ? parseInt(form.usageLimit, 10) : null
    if (minSpend !== null && !(minSpend >= 0)) return setError("The minimum spend must be zero or more.")
    if (usageLimit !== null && !(usageLimit > 0)) return setError("The usage limit must be at least 1.")
    setSaving(true)
    try {
      const made = clean<Coupon>(await api("/coupons", {
        method: "POST",
        body: {
          type: form.type, value, ...(code ? { code } : {}), minSpend, usageLimit,
          expiresAt: form.expiresAt ? new Date(form.expiresAt + "T23:59:59").toISOString() : null,
        },
      }))
      useDataStore.getState().upsert("coupons", made, true)
      setOpen(false)
      setForm(blank)
      setError("")
      notify.success("Discount code created", `${made.code} · ${describe(made)}`)
    } catch (err) {
      setError(errorMessage(err, "Could not save the code."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">Give these codes to customers. When they hand one to the cashier, the discount comes off their current total.</p>
        <Button onClick={() => { setOpen(true); setError("") }}><Plus className="h-4 w-4" />New discount code</Button>
      </div>

      <Card><CardContent className="p-0">
        {loaded && codes.length === 0 ? (
          <EmptyState icon={<Ticket className="h-10 w-10" />} title="No discount codes yet" description="Create a code, like THANKYOU10, and share it with your customers." />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Rules</TableHead><TableHead>Used</TableHead><TableHead>Status</TableHead><TableHead>On</TableHead></TableRow></TableHeader>
            <TableBody>
              {codes.map((c) => {
                const st = status(c)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold">
                        {c.code}
                        <button type="button" onClick={() => void copy(c.code)} aria-label={`Copy ${c.code}`} className="text-gray-400 hover:text-gray-700"><Copy className="h-3.5 w-3.5" /></button>
                      </span>
                    </TableCell>
                    <TableCell>{describe(c)}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {c.minSpend ? `Spend ${formatCurrency(c.minSpend)}+ · ` : ""}{c.usageLimit ? `${c.usageLimit} use${c.usageLimit === 1 ? "" : "s"} · ` : "Unlimited · "}{c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : "No expiry"}
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => void showUsage(c)} className="text-blue-600 hover:underline">{c.uses}×{c.usageLimit ? ` of ${c.usageLimit}` : ""}</button>
                    </TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell><Switch checked={c.isActive} onChange={(v: boolean) => void toggle(c, v)} aria-label={`${c.code} on or off`} /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="New discount code" size="md">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={[{ value: "percent", label: "Percentage off the total" }, { value: "fixed", label: "Fixed amount off" }]} value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, type: e.target.value })} />
            <Input label={form.type === "percent" ? "Percent off" : "Amount off (KES)"} type="number" min="1" max={form.type === "percent" ? 100 : undefined} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} autoFocus />
          </div>
          <Input label="Code (optional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Leave empty to generate one" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum spend (KES)" type="number" min="0" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} placeholder="None" />
            <Input label="Times it can be used" type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
          </div>
          <Input label="Expires (optional)" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create code"}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!usage} onClose={() => setUsage(null)} title={usage ? `${usage.code} · where it was used` : ""} size="lg">
        {usage && (usage.sales.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">This code has not been used yet.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{usage.uses} use{usage.uses === 1 ? "" : "s"} · {formatCurrency(usage.totalDiscounted)} taken off in total</p>
            <Table>
              <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Served by</TableHead><TableHead>Discount</TableHead><TableHead>Sale total</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
              <TableBody>
                {usage.sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.receiptNumber}{s.status === "refunded" && <Badge variant="danger" className="ml-2">refunded</Badge>}</TableCell>
                    <TableCell>{s.cashier ?? "-"}</TableCell>
                    <TableCell>{formatCurrency(s.discountTotal)}</TableCell>
                    <TableCell>{formatCurrency(s.total)}</TableCell>
                    <TableCell className="text-gray-500">{formatDateTime(s.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </Dialog>
    </div>
  )
}
