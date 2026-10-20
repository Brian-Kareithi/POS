import type { Product } from "@/lib/types"

/** Units on hand, as counted by the server. */
export function getStock(product: Product): number {
  return product.stock ?? 0
}

/** Units per branch id, as counted by the server. Their sum is `product.stock`. */
export function branchStockMap(product: Product, _branchIds: string[] = []): Record<string, number> {
  return product.branchStock ?? {}
}

export function getBranchStock(product: Product, branchId: string, branchIds: string[]): number {
  return branchStockMap(product, branchIds)[branchId] ?? 0
}

export type ExpiryStatus = "none" | "ok" | "soon" | "expired"

/** "soon" means it expires within the next 30 days. */
export function expiryStatus(product: Product, now = Date.now()): ExpiryStatus {
  if (!product.expiryDate) return "none"
  const days = (new Date(product.expiryDate).getTime() - now) / 86400000
  return days < 0 ? "expired" : days <= 30 ? "soon" : "ok"
}

export function daysToExpiry(product: Product, now = Date.now()): number | null {
  return product.expiryDate ? Math.ceil((new Date(product.expiryDate).getTime() - now) / 86400000) : null
}
