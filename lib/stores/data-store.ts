import { create } from "zustand"
import type {
  Business, Branch, Warehouse, Category, Brand, Supplier,
  Product, Customer, CustomerGroup, Employee, Notification, User,
  Sale, PurchaseOrder, StockTransfer, Transaction, StockAdjustment, AuditLog, ShiftRecord, Promotion, Coupon,
} from "@/lib/types"

/** Server data cached in memory. It is loaded after sign-in and never persisted, so it can't go stale across sessions or users. */
interface Collections {
  branches: Branch[]
  warehouses: Warehouse[]
  categories: Category[]
  brands: Brand[]
  suppliers: Supplier[]
  products: Product[]
  customers: Customer[]
  customerGroups: CustomerGroup[]
  users: User[]
  employees: Employee[]
  notifications: Notification[]
  sales: Sale[]
  purchaseOrders: PurchaseOrder[]
  stockTransfers: StockTransfer[]
  transactions: Transaction[]
  stockAdjustments: StockAdjustment[]
  auditLogs: AuditLog[]
  shiftRecords: ShiftRecord[]
  promotions: Promotion[]
  coupons: Coupon[]
}

export type CollectionKey = keyof Collections

interface DataState extends Collections {
  business: Business | null
  /** True once the first load after sign-in has finished (successfully or not). */
  loaded: boolean
  loadError: string | null
  setBusiness: (business: Business | null) => void
  setLoaded: (loaded: boolean, error?: string | null) => void
  setCollection: <K extends CollectionKey>(key: K, rows: Collections[K]) => void
  /** Replace the row with the same id, or add it (at the front when `prepend`). */
  upsert: <K extends CollectionKey>(key: K, row: Collections[K][number], prepend?: boolean) => void
  patch: <K extends CollectionKey>(key: K, id: string, changes: Partial<Collections[K][number]>) => void
  remove: (key: CollectionKey, id: string) => void
  reset: () => void
}

const empty: Collections & { business: null; loaded: boolean; loadError: null } = {
  business: null, loaded: false, loadError: null,
  branches: [], warehouses: [], categories: [], brands: [], suppliers: [], products: [], customers: [], customerGroups: [],
  users: [], employees: [], notifications: [], sales: [], purchaseOrders: [], stockTransfers: [], transactions: [],
  stockAdjustments: [], auditLogs: [], shiftRecords: [], promotions: [], coupons: [],
}

type Row = { id: string }

export const useDataStore = create<DataState>()((set) => ({
  ...empty,
  setBusiness: (business) => set({ business }),
  setLoaded: (loaded, error = null) => set({ loaded, loadError: error }),
  setCollection: (key, rows) => set({ [key]: rows } as Partial<DataState>),
  upsert: (key, row, prepend = false) =>
    set((s) => {
      const list = s[key] as unknown as Row[]
      const r = row as unknown as Row
      const next = list.some((x) => x.id === r.id) ? list.map((x) => (x.id === r.id ? r : x)) : prepend ? [r, ...list] : [...list, r]
      return { [key]: next } as Partial<DataState>
    }),
  patch: (key, id, changes) =>
    set((s) => ({ [key]: (s[key] as unknown as Row[]).map((x) => (x.id === id ? { ...x, ...changes } : x)) }) as Partial<DataState>),
  remove: (key, id) => set((s) => ({ [key]: (s[key] as unknown as Row[]).filter((x) => x.id !== id) }) as Partial<DataState>),
  reset: () => set({ ...empty }),
}))
