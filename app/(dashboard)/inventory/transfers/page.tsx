"use client"

import { useState } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowRight } from "lucide-react"
import { generateId } from "@/lib/utils/generators"
import { getBranchStock } from "@/lib/utils/stock"
import { formatDateTime } from "@/lib/utils/format"
import type { StockTransfer } from "@/lib/types"

const variant: Record<StockTransfer["status"], "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning", approved: "info", completed: "success", cancelled: "danger",
}

export default function TransfersPage() {
  const { stockTransfers, products, branches, warehouses, setStockTransfers, addStockTransfer, transferStock, logAudit } = useDataStore()
  const user = useAuthStore((s) => s.user)
  const canApprove = can(user?.role, "price.change")
  const canMove = can(user?.role, "stock.edit")
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("12")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const ids = branches.map((b) => b.id)
  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name ?? "—"
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Item"
  const setStatus = (id: string, status: StockTransfer["status"]) =>
    setStockTransfers(stockTransfers.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)))

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    const product = products.find((p) => p.id === productId)
    if (!from || !to || !product) return setError("Choose the branches and a product.")
    if (from === to) return setError("The two branches must be different.")
    if (!(qty > 0)) return setError("Enter a quantity.")
    const available = getBranchStock(product, from, ids)
    if (qty > available) return setError(`${branchName(from)} only has ${available} of ${product.name}.`)
    addStockTransfer({
      id: generateId(), businessId: user?.businessId ?? "", fromWarehouseId: warehouses[0]?.id ?? "", toWarehouseId: warehouses[0]?.id ?? "",
      fromBranchId: from, toBranchId: to, productId, quantity: qty, status: "pending", notes: notes || undefined,
      createdBy: user?.id ?? "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    logAudit("Transfer requested", "Transfer", `${qty} × ${product.name}: ${branchName(from)} → ${branchName(to)}`)
    notify.success("Transfer requested", `${qty} × ${product.name} to ${branchName(to)}`)
    setOpen(false)
    setNotes("")
    setError("")
  }

  const complete = (t: StockTransfer) => {
    if (!t.fromBranchId || !t.toBranchId) return
    transferStock(t.productId, t.fromBranchId, t.toBranchId, t.quantity)
    setStatus(t.id, "completed")
    notify.success("Transfer completed", `${t.quantity} × ${productName(t.productId)} moved to ${branchName(t.toBranchId)}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Branch Transfers" description="Move stock between your shops. Each branch keeps its own stock count.">
        {canMove && <Button onClick={() => { setOpen(true); setError("") }}><Plus className="h-4 w-4" />New Transfer</Button>}
      </PageHeader>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {stockTransfers.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">No transfers yet.</TableCell></TableRow>}
            {stockTransfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{productName(t.productId)}</TableCell>
                <TableCell>{t.quantity}</TableCell>
                <TableCell><span className="inline-flex items-center gap-2 text-sm">{branchName(t.fromBranchId)}<ArrowRight className="h-3.5 w-3.5 text-gray-400" />{branchName(t.toBranchId)}</span></TableCell>
                <TableCell><Badge variant={variant[t.status]}>{t.status}</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(t.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {t.status === "pending" && canApprove && <Button size="sm" variant="secondary" onClick={() => { setStatus(t.id, "approved"); logAudit("Transfer approved", "Transfer", `${t.quantity} × ${productName(t.productId)} to ${branchName(t.toBranchId)}`) }}>Approve</Button>}
                    {t.status === "approved" && canMove && <Button size="sm" onClick={() => complete(t)}>Mark delivered</Button>}
                    {(t.status === "pending" || t.status === "approved") && canMove && <Button size="sm" variant="secondary" onClick={() => setStatus(t.id, "cancelled")}>Cancel</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="New branch transfer" size="md">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="From" placeholder="Branch" options={branches.map((b) => ({ value: b.id, label: b.name }))} value={from} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFrom(e.target.value)} />
            <Select label="To" placeholder="Branch" options={branches.map((b) => ({ value: b.id, label: b.name }))} value={to} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTo(e.target.value)} />
          </div>
          <Select label="Product" placeholder="Select product" options={products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: from ? `${p.name} (${getBranchStock(p, from, ids)} at ${branchName(from)})` : p.name }))} value={productId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProductId(e.target.value)} />
          <Input label="Quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Request transfer</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
