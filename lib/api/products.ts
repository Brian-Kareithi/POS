import { api } from "@/lib/api/client"
import { toProduct } from "@/lib/api/mappers"
import { refresh } from "@/lib/api/sync"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import type { Product } from "@/lib/types"

export interface NewProduct {
  name: string
  categoryId: string
  brandId?: string
  supplierId?: string
  sku?: string
  barcode?: string
  description?: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  unit?: string
  minStock?: number
  maxStock?: number
  expiryDate?: string
  batchNumber?: string
  /** Units on hand now, booked as opening stock at the user's branch. */
  openingStock?: number
}

/** Short, readable and unique enough: the server rejects a duplicate and the caller can retry. */
export function makeSku(name: string, categoryName = ""): string {
  const prefix = (categoryName.replace(/[^a-z0-9]/gi, "").slice(0, 3) || "GEN").toUpperCase()
  const part = (name.replace(/[^a-z0-9]/gi, "").slice(0, 3) || "ITM").toUpperCase()
  return `${prefix}-${part}-${Math.floor(Math.random() * 100000).toString().padStart(5, "0")}`
}

export async function createProduct(input: NewProduct): Promise<Product> {
  const data = useDataStore.getState()
  const user = useAuthStore.getState().user
  const categoryName = data.categories.find((c) => c.id === input.categoryId)?.name
  const stockBranch = user?.branchId ?? data.branches[0]?.id
  const body = {
    categoryId: input.categoryId,
    name: input.name,
    sku: input.sku || makeSku(input.name, categoryName),
    ...(input.barcode ? { barcode: input.barcode } : {}),
    ...(input.brandId ? { brandId: input.brandId } : {}),
    ...(input.supplierId ? { supplierId: input.supplierId } : {}),
    ...(input.description ? { description: input.description } : {}),
    costPrice: input.costPrice,
    sellingPrice: input.sellingPrice,
    taxRate: input.taxRate,
    ...(input.unit ? { unit: input.unit } : {}),
    minStock: input.minStock ?? 0,
    maxStock: input.maxStock ?? 0,
    ...(input.expiryDate ? { expiryDate: input.expiryDate } : {}),
    ...(input.batchNumber ? { batchNumber: input.batchNumber } : {}),
    // Opening stock needs stock.edit; everyone else creates the product with none.
    ...(input.openingStock && input.openingStock > 0 && stockBranch && can(user?.role, "stock.edit") ? { branchStock: { [stockBranch]: Math.floor(input.openingStock) } } : {}),
  }
  const created = toProduct(await api("/products", { method: "POST", body }))
  data.upsert("products", created)
  void refresh.adjustments().catch(() => {})
  return created
}

export interface ProductChanges {
  name?: string
  categoryId?: string
  brandId?: string | null
  supplierId?: string | null
  barcode?: string
  description?: string | null
  costPrice?: number
  sellingPrice?: number
  taxRate?: number
  unit?: string
  minStock?: number
  maxStock?: number
  expiryDate?: string | null
  batchNumber?: string | null
  isActive?: boolean
  image?: string | null
}

export async function updateProduct(id: string, changes: ProductChanges): Promise<Product> {
  // The update response has no stock figures, so keep the ones we already have.
  const before = useDataStore.getState().products.find((p) => p.id === id)
  const saved = toProduct(await api(`/products/${id}`, { method: "PATCH", body: changes }))
  const merged = { ...saved, stock: before?.stock, branchStock: before?.branchStock }
  useDataStore.getState().upsert("products", await refresh.product(id).catch(() => merged))
  return merged
}
