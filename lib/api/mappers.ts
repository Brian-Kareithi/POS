import type {
  AuditLog, Branch, Business, Customer, Employee, Notification, Product, PurchaseOrder, Sale, ShiftRecord,
  StockAdjustment, StockTransfer, Supplier, Transaction, User, Warehouse,
} from "@/lib/types"

/** Drops `null` keys: the backend sends null where the frontend types say "missing". */
export function clean<T>(row: unknown): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row as Record<string, unknown>)) if (v !== null) out[k] = v
  return out as T
}

const str = (v: unknown) => (typeof v === "string" ? v : "")

export const toBusiness = (r: unknown): Business => {
  const b = clean<Record<string, unknown>>(r)
  return { ...(b as unknown as Business), email: str(b.email), phone: str(b.phone), address: str(b.address) }
}

export const toBranch = (r: unknown): Branch => {
  const b = clean<Record<string, unknown>>(r)
  return { ...(b as unknown as Branch), address: str(b.address), phone: str(b.phone), email: str(b.email) }
}

export const toWarehouse = (r: unknown): Warehouse => {
  const w = clean<Record<string, unknown>>(r)
  return { ...(w as unknown as Warehouse), address: str(w.address), createdAt: str(w.createdAt) }
}

export const toSupplier = (r: unknown): Supplier => {
  const s = clean<Record<string, unknown>>(r)
  return { ...(s as unknown as Supplier), contactPerson: str(s.contactPerson), email: str(s.email), phone: str(s.phone), address: str(s.address), createdAt: str(s.createdAt) }
}

export const toCustomer = (r: unknown): Customer => {
  const c = clean<Record<string, unknown>>(r)
  return { ...(c as unknown as Customer), email: str(c.email), phone: str(c.phone) }
}

export const toProduct = (r: unknown): Product => {
  const p = clean<Record<string, unknown>>(r)
  return { ...(p as unknown as Product), costPrice: Number(p.costPrice ?? 0) }
}

export const toSale = (r: unknown): Sale => {
  const s = clean<Record<string, unknown>>(r)
  return { ...(s as unknown as Sale), userId: str(s.userId) }
}

export const toNotification = (r: unknown): Notification => {
  const n = clean<Record<string, unknown>>(r)
  const roles = Array.isArray(n.roles) && n.roles.length ? n.roles : undefined
  return { ...(n as unknown as Notification), userId: str(n.userId), roles: roles as Notification["roles"] }
}

export const toTransaction = (r: unknown) => clean<Transaction>(r)
export const toTransfer = (r: unknown) => clean<StockTransfer>(r)
export const toPurchaseOrder = (r: unknown) => clean<PurchaseOrder>(r)
export const toAudit = (r: unknown) => clean<AuditLog>(r)

interface StaffRow {
  id: string; userId: string; businessId: string; branchId: string | null; role: Employee["role"]; salary?: number | null
  hireDate: string; isActive: boolean; approval: Employee["approval"]; name: string; email: string; phone: string | null
  avatar: string | null; createdAt: string
}

/** One staff row from `GET /staff` becomes both an Employee and the User the pages look people up by. */
export function toStaff(r: unknown): { employee: Employee; user: User } {
  const s = r as StaffRow
  const user: User = {
    id: s.userId, email: s.email, name: s.name, role: s.role, businessId: s.businessId, branchId: s.branchId ?? undefined,
    avatar: s.avatar ?? undefined, phone: s.phone ?? undefined, emailVerified: true, twoFactorEnabled: false,
    createdAt: s.createdAt, updatedAt: s.createdAt,
  }
  const employee: Employee = {
    id: s.id, userId: s.userId, businessId: s.businessId, branchId: s.branchId ?? undefined, role: s.role,
    salary: s.salary ?? undefined, hireDate: s.hireDate, isActive: s.isActive, approval: s.approval, user,
  }
  return { employee, user }
}

export function toShift(r: unknown, nameOf: (userId: string) => string): ShiftRecord {
  const s = clean<Record<string, unknown>>(r)
  return { ...(s as unknown as ShiftRecord), userName: nameOf(str(s.userId)) }
}

export function toAdjustment(r: unknown, products: Product[], nameOf: (userId: string) => string): StockAdjustment {
  const a = clean<Record<string, unknown>>(r)
  const p = products.find((x) => x.id === a.productId)
  return {
    id: str(a.id), productId: str(a.productId), productName: p?.name ?? "Unknown product", sku: p?.sku ?? "",
    change: Number(a.change), reason: str(a.reason), userName: a.userId ? nameOf(str(a.userId)) : "System", createdAt: str(a.createdAt),
  }
}
