import type { Product } from "@/lib/types"

// Matches a scanned or typed code against a product barcode or SKU (exact, case-insensitive).
export function findProductByCode(products: Product[], code: string): Product | undefined {
  const value = code.trim().toLowerCase()
  if (!value) return undefined
  return products.find((p) => p.isActive && (p.barcode.toLowerCase() === value || p.sku.toLowerCase() === value))
}

export function isBarcodeTaken(products: Product[], barcode: string, ignoreId?: string): boolean {
  const value = barcode.trim().toLowerCase()
  return products.some((p) => p.id !== ignoreId && p.barcode.toLowerCase() === value)
}
