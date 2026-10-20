"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getBranchStock } from "@/lib/utils/stock"
import { notify } from "@/lib/toast"
import { api, errorMessage } from "@/lib/api/client"
import { refresh } from "@/lib/api/sync"
import type { Product } from "@/lib/types"

const reasons = ["Stock count correction", "Received from supplier", "Damaged goods", "Expired", "Theft/loss", "Returned to stock", "Other"]

export function StockDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return product ? <StockForm key={product.id} product={product} onClose={onClose} /> : null
}

function StockForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const branches = useDataStore((s) => s.branches)
  const user = useAuthStore((s) => s.user)
  const branchIds = branches.map((b) => b.id)
  const [branchId, setBranchId] = useState(user?.branchId ?? branchIds[0] ?? "")
  const current = getBranchStock(product, branchId, branchIds)
  const [mode, setMode] = useState<"add" | "set">("add")
  const [value, setValue] = useState("")
  const [reason, setReason] = useState(reasons[1])
  const [error, setError] = useState("")

  const amount = parseInt(value, 10)
  const next = Number.isNaN(amount) ? current : mode === "add" ? current + amount : amount

  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (Number.isNaN(amount)) return setError("Enter a number.")
    if (next < 0) return setError("Stock can't go below zero.")
    if (next === current) return setError("That doesn't change the stock.")
    setSaving(true)
    try {
      if (mode === "add") await api("/inventory/adjust", { method: "POST", body: { productId: product.id, branchId, change: amount, reason } })
      else await api("/inventory/set", { method: "POST", body: { productId: product.id, branchId, quantity: next, reason } })
      await Promise.all([refresh.product(product.id), refresh.adjustments().catch(() => {})])
    } catch (err) {
      setSaving(false)
      return setError(errorMessage(err, "Could not update the stock."))
    }
    setSaving(false)
    notify.success("Stock updated", `${product.name}: ${current} → ${next}`)
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title={`Update stock · ${product.name}`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {branches.length > 1 && <Select label="Branch" options={branches.map((b) => ({ value: b.id, label: b.name }))} value={branchId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setBranchId(e.target.value); setValue("") }} />}
        <p className="text-sm text-gray-500">Currently in stock: <span className="font-semibold text-gray-900">{current}</span></p>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-sm">
          {([["add", "Add / remove"], ["set", "Set total"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={`rounded-md py-1.5 font-medium ${mode === id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}>{label}</button>
          ))}
        </div>
        <Input label={mode === "add" ? "Quantity (use a minus to remove)" : "New stock total"} type="number" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        <Select label="Reason" options={reasons.map((r) => ({ value: r, label: r }))} value={reason} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value)} />
        <p className="text-sm text-gray-500">New stock: <span className="font-semibold text-gray-900">{next}</span></p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={saving}>Save</Button>
        </div>
      </form>
    </Dialog>
  )
}
