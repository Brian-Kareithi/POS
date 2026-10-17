import type { Product } from "@/lib/types"

// Fictional on-hand stock, derived from the SKU so it stays stable between loads.
export function getStock(product: Product): number {
  if (typeof product.stock === "number") return product.stock
  const hash = [...product.sku].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7)
  return hash % 7 === 0 ? Math.max(0, product.minStock - 3) : product.minStock + 15 + (hash % 120)
}

/** Units per branch. Products that have never been split get 65% at the first (main) branch and the rest shared across the others. */
export function branchStockMap(product: Product, branchIds: string[]): Record<string, number> {
  if (product.branchStock) return product.branchStock
  const total = getStock(product)
  const map: Record<string, number> = {}
  if (branchIds.length === 0) return map
  const first = branchIds.length === 1 ? total : Math.round(total * 0.65)
  map[branchIds[0]] = first
  const others = branchIds.slice(1)
  const rest = total - first
  others.forEach((id, i) => {
    const share = Math.floor(rest / others.length)
    map[id] = i === others.length - 1 ? rest - share * (others.length - 1) : share
  })
  return map
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
