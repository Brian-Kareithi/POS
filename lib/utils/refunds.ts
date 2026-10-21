import type { Sale, SaleItem } from "@/lib/types"

/** Units on a line that have not been refunded yet. */
export const unitsLeft = (item: Pick<SaleItem, "quantity" | "refundedQty">) => item.quantity - (item.refundedQty ?? 0)

/** Roughly what refunding `qty` units of a line returns (the server works out the exact figure, down to the cent). */
export const refundShare = (item: Pick<SaleItem, "quantity" | "total">, qty: number) => (item.quantity > 0 ? (item.total * qty) / item.quantity : 0)

/**
 * none: nothing refunded. partial: some items or units came back, the sale still stands.
 * full: everything came back, either in one go (status "refunded") or in steps.
 */
export function refundState(sale: Pick<Sale, "status" | "refundedAmount"> & { items?: Pick<SaleItem, "quantity" | "refundedQty">[] }): "none" | "partial" | "full" {
  if (sale.status === "refunded") return "full"
  if (!sale.refundedAmount || sale.refundedAmount <= 0) return "none"
  const items = sale.items ?? []
  return items.length > 0 && items.every((i) => unitsLeft(i) <= 0) ? "full" : "partial"
}
