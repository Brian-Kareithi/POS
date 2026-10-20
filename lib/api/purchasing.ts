import { api } from "@/lib/api/client"
import { toPurchaseOrder, toTransfer } from "@/lib/api/mappers"
import { refresh } from "@/lib/api/sync"
import { useDataStore } from "@/lib/stores/data-store"
import type { PurchaseOrder, StockTransfer } from "@/lib/types"

const store = () => useDataStore.getState()

/** Creates the order as a draft and submits it, so it lands as "pending" for a manager to approve. */
export async function createPurchaseOrder(input: { supplierId: string; warehouseId: string; notes?: string; items: { productId: string; quantity: number; unitPrice: number }[] }): Promise<PurchaseOrder> {
  const draft = await api<{ id: string }>("/purchase-orders", { method: "POST", body: { ...input, ...(input.notes ? {} : { notes: undefined }) } })
  const order = toPurchaseOrder(await api(`/purchase-orders/${draft.id}/submit`, { method: "POST" }))
  store().upsert("purchaseOrders", order, true)
  return order
}

export async function approvePurchaseOrder(id: string) {
  store().upsert("purchaseOrders", toPurchaseOrder(await api(`/purchase-orders/${id}/approve`, { method: "POST" })))
}

/** Books in everything still outstanding on the order. */
export async function receivePurchaseOrder(order: PurchaseOrder) {
  const items = (order.items ?? []).filter((i) => i.quantity - i.received > 0).map((i) => ({ itemId: i.id, quantity: i.quantity - i.received }))
  store().upsert("purchaseOrders", toPurchaseOrder(await api(`/purchase-orders/${order.id}/receive`, { method: "POST", body: { items } })))
  await Promise.allSettled([refresh.products(), refresh.adjustments()])
}

export async function createTransfer(input: { fromBranchId: string; toBranchId: string; productId: string; quantity: number; notes?: string }): Promise<StockTransfer> {
  // Transfers name a warehouse at each end; the branch ids decide where the stock actually moves.
  const wh = store().warehouses[0]?.id
  if (!wh) throw new Error("Add a warehouse first (Inventory → Warehouses).")
  const t = toTransfer(await api("/transfers", { method: "POST", body: { ...input, fromWarehouseId: wh, toWarehouseId: wh } }))
  store().upsert("stockTransfers", t, true)
  return t
}

export async function moveTransfer(id: string, step: "approve" | "complete" | "cancel") {
  store().upsert("stockTransfers", toTransfer(await api(`/transfers/${id}/${step}`, { method: "POST" })))
  if (step === "complete") await Promise.allSettled([refresh.products(), refresh.adjustments()])
}
