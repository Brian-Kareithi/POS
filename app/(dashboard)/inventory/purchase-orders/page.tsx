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
import { Plus, Trash2, PackageCheck } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/types"

const statusVariant: Record<PurchaseOrder["status"], "default" | "success" | "warning" | "danger" | "info"> = {
  draft: "default", pending: "warning", approved: "info", received: "success", cancelled: "danger",
}

type Line = { productId: string; quantity: string }

export default function PurchaseOrdersPage() {
  const { purchaseOrders, suppliers, warehouses, products, setPurchaseOrders, addPurchaseOrder, adjustStock, logAudit } = useDataStore()
  const user = useAuthStore((s) => s.user)
  const canManage = can(user?.role, "purchase.manage")
  const canApprove = can(user?.role, "price.change")
  const [open, setOpen] = useState(false)
  const [supplierId, setSupplierId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "24" }])
  const [error, setError] = useState("")

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Item"
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—"

  const update = (id: string, changes: Partial<PurchaseOrder>) =>
    setPurchaseOrders(purchaseOrders.map((o) => (o.id === id ? { ...o, ...changes, updatedAt: new Date().toISOString() } : o)))

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    const valid = lines.filter((l) => l.productId && parseInt(l.quantity, 10) > 0)
    if (!supplierId || !warehouseId) return setError("Choose a supplier and a warehouse.")
    if (valid.length === 0) return setError("Add at least one product with a quantity.")
    const id = generateId()
    const items: PurchaseOrderItem[] = valid.map((l) => {
      const product = products.find((p) => p.id === l.productId)!
      const quantity = parseInt(l.quantity, 10)
      return { id: generateId(), purchaseOrderId: id, productId: product.id, quantity, received: 0, unitPrice: product.costPrice, total: product.costPrice * quantity }
    })
    const order: PurchaseOrder = {
      id, businessId: user?.businessId ?? "", supplierId, warehouseId, orderNumber: `PO-${3200 + purchaseOrders.length}`,
      status: "pending", total: items.reduce((s, i) => s + i.total, 0), items, createdBy: user?.id ?? "",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    addPurchaseOrder(order)
    logAudit("Purchase order created", "Purchase order", `${order.orderNumber} to ${supplierName(supplierId)} for ${formatCurrency(order.total)}`)
    notify.success("Purchase order created", `${order.orderNumber} · ${formatCurrency(order.total)}`)
    setOpen(false)
    setLines([{ productId: "", quantity: "24" }])
    setError("")
  }

  const approve = (order: PurchaseOrder) => {
    update(order.id, { status: "approved" })
    logAudit("Purchase order approved", "Purchase order", `${order.orderNumber} approved (${formatCurrency(order.total)})`)
    notify.success("Order approved", order.orderNumber)
  }

  const receive = (order: PurchaseOrder) => {
    order.items?.forEach((i) => adjustStock(i.productId, i.quantity - i.received, `Goods received · ${order.orderNumber}`, user?.name))
    update(order.id, { status: "received", items: order.items?.map((i) => ({ ...i, received: i.quantity })) })
    logAudit("Goods received", "Purchase order", `${order.orderNumber} received from ${supplierName(order.supplierId)}`)
    notify.success("Goods received", `${order.orderNumber}: stock levels updated`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description="Order from suppliers and book goods in when they arrive">
        {canManage && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New Order</Button>}
      </PageHeader>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Supplier</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {purchaseOrders.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-500">No purchase orders yet.</TableCell></TableRow>}
            {purchaseOrders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.orderNumber}</TableCell>
                <TableCell>{supplierName(o.supplierId)}</TableCell>
                <TableCell className="text-gray-500">{o.items?.map((i) => `${i.quantity}× ${productName(i.productId)}`).slice(0, 2).join(", ")}{(o.items?.length ?? 0) > 2 ? ` +${(o.items?.length ?? 0) - 2} more` : ""}</TableCell>
                <TableCell>{formatCurrency(o.total)}</TableCell>
                <TableCell><Badge variant={statusVariant[o.status]}>{o.status}</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(o.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {o.status === "pending" && canApprove && <Button size="sm" variant="secondary" onClick={() => approve(o)}>Approve</Button>}
                    {o.status === "approved" && canManage && <Button size="sm" onClick={() => receive(o)}><PackageCheck className="h-3.5 w-3.5" />Receive goods</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="New purchase order" size="lg">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Supplier" placeholder="Select supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} value={supplierId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupplierId(e.target.value)} />
            <Select label="Deliver to" placeholder="Select warehouse" options={warehouses.map((w) => ({ value: w.id, label: w.name }))} value={warehouseId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWarehouseId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Products</p>
            {lines.map((line, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1"><Select placeholder="Select product" options={products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: `${p.name} (cost ${formatCurrency(p.costPrice)})` }))} value={line.productId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLines((all) => all.map((l, j) => (j === i ? { ...l, productId: e.target.value } : l)))} /></div>
                <div className="w-24"><Input type="number" min="1" value={line.quantity} onChange={(e) => setLines((all) => all.map((l, j) => (j === i ? { ...l, quantity: e.target.value } : l)))} /></div>
                <Button type="button" variant="secondary" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((all) => all.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setLines((all) => [...all, { productId: "", quantity: "24" }])}><Plus className="h-3.5 w-3.5" />Add product</Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create order</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
