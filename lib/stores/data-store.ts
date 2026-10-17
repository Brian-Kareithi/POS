import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getStock, branchStockMap } from "@/lib/utils/stock"
import { useAuthStore } from "@/lib/stores/auth-store"
import { notify } from "@/lib/toast"
import type {
  Business, Branch, Warehouse, Category, Brand, Supplier,
  Product, Customer, CustomerGroup, Employee, Notification, User,
  Sale, PurchaseOrder, StockTransfer, Transaction, StockAdjustment, AuditLog, ShiftRecord, Promotion
} from "@/lib/types"

const rid = () => Math.random().toString(36).slice(2, 12)

function auditEntry(action: string, entity: string, detail: string, severity: AuditLog["severity"] = "info"): AuditLog {
  const user = useAuthStore.getState().user
  return {
    id: rid(), userId: user?.id ?? "system", userName: user?.name ?? "System", role: user?.role ?? "system",
    action, entity, detail, severity, createdAt: new Date().toISOString(),
  }
}

function alertFor(entry: AuditLog): Notification[] {
  if (entry.severity === "info") return []
  if (typeof window !== "undefined") (entry.severity === "critical" ? notify.error : notify.warning)(entry.action, entry.detail)
  return [{ id: rid(), userId: "", title: entry.action, message: entry.detail, type: entry.severity === "critical" ? "error" : "warning", read: false, createdAt: entry.createdAt }]
}

interface DataState {
  business: Business | null
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
  logAudit: (action: string, entity: string, detail: string, severity?: AuditLog["severity"]) => void
  setAuditLogs: (logs: AuditLog[]) => void
  setShiftRecords: (shifts: ShiftRecord[]) => void
  setPromotions: (promotions: Promotion[]) => void
  addPromotion: (promotion: Promotion) => void
  updatePromotion: (id: string, updates: Partial<Promotion>) => void
  openShift: (shift: ShiftRecord) => void
  closeShift: (id: string, update: Partial<ShiftRecord>) => void
  recordCustomerPayment: (customerId: string, amount: number, method: string) => void
  setStockAdjustments: (adjustments: StockAdjustment[]) => void
  adjustStock: (productId: string, change: number, reason?: string, userName?: string, branchId?: string) => void
  setStock: (productId: string, quantity: number, reason: string, userName: string, branchId?: string) => void
  transferStock: (productId: string, fromBranchId: string, toBranchId: string, quantity: number) => void
  setBusiness: (business: Business) => void
  setBranches: (branches: Branch[]) => void
  setWarehouses: (warehouses: Warehouse[]) => void
  setCategories: (categories: Category[]) => void
  setBrands: (brands: Brand[]) => void
  setSuppliers: (suppliers: Supplier[]) => void
  setProducts: (products: Product[]) => void
  setCustomers: (customers: Customer[]) => void
  setCustomerGroups: (groups: CustomerGroup[]) => void
  setUsers: (users: User[]) => void
  setEmployees: (employees: Employee[]) => void
  setNotifications: (notifications: Notification[]) => void
  setSales: (sales: Sale[]) => void
  setPurchaseOrders: (orders: PurchaseOrder[]) => void
  setStockTransfers: (transfers: StockTransfer[]) => void
  setTransactions: (transactions: Transaction[]) => void
  addProduct: (product: Product) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  removeProduct: (id: string) => void
  addSale: (sale: Sale) => void
  updateSale: (id: string, updates: Partial<Sale>) => void
  removeSale: (id: string) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addTransaction: (transaction: Transaction) => void
  addPurchaseOrder: (order: PurchaseOrder) => void
  addStockTransfer: (transfer: StockTransfer) => void
  addCustomer: (customer: Customer) => void
  addCustomerGroup: (group: CustomerGroup) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  addEmployee: (employee: Employee) => void
  addBranch: (branch: Branch) => void
  addWarehouse: (warehouse: Warehouse) => void
  addCategory: (category: Category) => void
  addBrand: (brand: Brand) => void
  addSupplier: (supplier: Supplier) => void
}

export const useDataStore = create<DataState>()(persist((set) => ({
  business: null,
  branches: [],
  warehouses: [],
  categories: [],
  brands: [],
  suppliers: [],
  products: [],
  customers: [],
  customerGroups: [],
  users: [],
  employees: [],
  notifications: [],
  sales: [],
  purchaseOrders: [],
  stockTransfers: [],
  transactions: [],
  stockAdjustments: [],
  auditLogs: [],
  shiftRecords: [],
  promotions: [],

  logAudit: (action, entity, detail, severity = "info") =>
    set((s) => {
      const entry = auditEntry(action, entity, detail, severity)
      return { auditLogs: [entry, ...s.auditLogs], notifications: [...alertFor(entry), ...s.notifications] }
    }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setShiftRecords: (shiftRecords) => set({ shiftRecords }),
  setPromotions: (promotions) => set({ promotions }),
  addPromotion: (promotion) => set((s) => ({ promotions: [promotion, ...s.promotions] })),
  updatePromotion: (id, updates) => set((s) => ({ promotions: s.promotions.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
  openShift: (shift) =>
    set((s) => ({
      shiftRecords: [shift, ...s.shiftRecords],
      auditLogs: [auditEntry("Shift opened", "Shift", `${shift.userName} opened a shift with KES ${shift.openingCash.toLocaleString()} float`), ...s.auditLogs],
    })),
  closeShift: (id, update) =>
    set((s) => {
      const variance = update.variance ?? 0
      const entry = auditEntry(
        "Shift closed", "Shift",
        `Counted KES ${(update.countedCash ?? 0).toLocaleString()} vs expected KES ${(update.expectedCash ?? 0).toLocaleString()} (variance ${variance >= 0 ? "+" : ""}${variance.toLocaleString()})`,
        Math.abs(variance) >= 500 ? "warning" : "info"
      )
      return {
        shiftRecords: s.shiftRecords.map((r) => (r.id === id ? { ...r, ...update } : r)),
        auditLogs: [entry, ...s.auditLogs],
        notifications: [...alertFor(entry), ...s.notifications],
      }
    }),
  recordCustomerPayment: (customerId, amount, method) =>
    set((s) => {
      const customer = s.customers.find((c) => c.id === customerId)
      if (!customer) return s
      const now = new Date().toISOString()
      const entry = auditEntry("Customer payment", "Customer", `${customer.name} paid KES ${amount.toLocaleString()} (${method}) towards their account`)
      return {
        customers: s.customers.map((c) => (c.id === customerId ? { ...c, amountOwed: Math.max(0, (c.amountOwed ?? 0) - amount) } : c)),
        transactions: [{ id: rid(), businessId: customer.businessId, type: "income" as const, category: "Credit repayment", amount, description: `Account payment · ${customer.name}`, reference: method, date: now, createdAt: now }, ...s.transactions],
        auditLogs: [entry, ...s.auditLogs],
      }
    }),
  setStockAdjustments: (stockAdjustments) => set({ stockAdjustments }),
  adjustStock: (productId, change, reason, userName, branchId) =>
    set((s) => {
      const product = s.products.find((p) => p.id === productId)
      if (!product) return s
      const ids = s.branches.map((b) => b.id)
      const target = branchId ?? ids[0] ?? "main"
      const map = { ...branchStockMap(product, ids.length ? ids : [target]) }
      map[target] = Math.max(0, (map[target] ?? 0) + change)
      const stock = Object.values(map).reduce((a, b) => a + b, 0)
      const where = ids.length > 1 ? ` at ${s.branches.find((b) => b.id === target)?.name ?? "branch"}` : ""
      const entry: StockAdjustment[] = reason
        ? [{ id: Math.random().toString(36).slice(2), productId, productName: product.name, sku: product.sku, change, reason: reason + where, userName: userName ?? "System", createdAt: new Date().toISOString() }]
        : []
      const audit = reason ? [auditEntry("Stock adjusted", "Product", `${product.name}${where}: ${change >= 0 ? "+" : ""}${change} (${reason})`, change <= -20 ? "warning" : "info")] : []
      return {
        products: s.products.map((p) => (p.id === productId ? { ...p, stock, branchStock: map, updatedAt: new Date().toISOString() } : p)),
        stockAdjustments: [...entry, ...s.stockAdjustments],
        auditLogs: [...audit, ...s.auditLogs],
        notifications: [...audit.flatMap(alertFor), ...s.notifications],
      }
    }),
  setStock: (productId, quantity, reason, userName, branchId) =>
    set((s) => {
      const product = s.products.find((p) => p.id === productId)
      if (!product) return s
      const ids = s.branches.map((b) => b.id)
      const target = branchId ?? ids[0] ?? "main"
      const map = { ...branchStockMap(product, ids.length ? ids : [target]) }
      const next = Math.max(0, Math.round(quantity))
      const change = next - (map[target] ?? 0)
      map[target] = next
      const stock = Object.values(map).reduce((a, b) => a + b, 0)
      const where = ids.length > 1 ? ` at ${s.branches.find((b) => b.id === target)?.name ?? "branch"}` : ""
      const audit = auditEntry("Stock adjusted", "Product", `${product.name}${where}: ${change >= 0 ? "+" : ""}${change} (${reason})`, change <= -20 ? "warning" : "info")
      return {
        auditLogs: [audit, ...s.auditLogs],
        notifications: [...alertFor(audit), ...s.notifications],
        products: s.products.map((p) => (p.id === productId ? { ...p, stock, branchStock: map, updatedAt: new Date().toISOString() } : p)),
        stockAdjustments: [{ id: Math.random().toString(36).slice(2), productId, productName: product.name, sku: product.sku, change, reason: reason + where, userName, createdAt: new Date().toISOString() }, ...s.stockAdjustments],
      }
    }),
  transferStock: (productId, fromBranchId, toBranchId, quantity) =>
    set((s) => {
      const product = s.products.find((p) => p.id === productId)
      if (!product) return s
      const ids = s.branches.map((b) => b.id)
      const map = { ...branchStockMap(product, ids) }
      const moved = Math.min(quantity, map[fromBranchId] ?? 0)
      map[fromBranchId] = (map[fromBranchId] ?? 0) - moved
      map[toBranchId] = (map[toBranchId] ?? 0) + moved
      const name = (id: string) => s.branches.find((b) => b.id === id)?.name ?? "branch"
      const audit = auditEntry("Stock transferred", "Product", `${moved} × ${product.name}: ${name(fromBranchId)} → ${name(toBranchId)}`)
      return {
        products: s.products.map((p) => (p.id === productId ? { ...p, branchStock: map, updatedAt: new Date().toISOString() } : p)),
        auditLogs: [audit, ...s.auditLogs],
      }
    }),

  setBusiness: (business) => set({ business }),
  setBranches: (branches) => set({ branches }),
  setWarehouses: (warehouses) => set({ warehouses }),
  setCategories: (categories) => set({ categories }),
  setBrands: (brands) => set({ brands }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setProducts: (products) => set({ products }),
  setCustomers: (customers) => set({ customers }),
  setCustomerGroups: (groups) => set({ customerGroups: groups }),
  setUsers: (users) => set({ users }),
  setEmployees: (employees) => set({ employees }),
  setNotifications: (notifications) => set({ notifications }),
  setSales: (sales) => set({ sales }),
  setPurchaseOrders: (orders) => set({ purchaseOrders: orders }),
  setStockTransfers: (transfers) => set({ stockTransfers: transfers }),
  setTransactions: (transactions) => set({ transactions }),

  addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
  updateProduct: (id, updates) =>
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removeProduct: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  addSale: (sale) => set((s) => ({ sales: [sale, ...s.sales] })),
  updateSale: (id, updates) =>
    set((s) => ({
      sales: s.sales.map((sale) => (sale.id === id ? { ...sale, ...updates } : sale)),
    })),
  removeSale: (id) =>
    set((s) => ({ sales: s.sales.filter((sale) => sale.id !== id) })),

  addNotification: (notification) =>
    set((s) => ({ notifications: [notification, ...s.notifications] })),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  addTransaction: (transaction) =>
    set((s) => ({ transactions: [...s.transactions, transaction] })),
  addPurchaseOrder: (order) =>
    set((s) => ({ purchaseOrders: [...s.purchaseOrders, order] })),
  addStockTransfer: (transfer) =>
    set((s) => ({ stockTransfers: [...s.stockTransfers, transfer] })),
  addCustomer: (customer) => set((s) => ({ customers: [...s.customers, customer] })),
  addCustomerGroup: (group) => set((s) => ({ customerGroups: [...s.customerGroups, group] })),
  updateCustomer: (id, updates) =>
    set((s) => ({
      customers: s.customers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  addEmployee: (employee) => set((s) => ({ employees: [...s.employees, employee] })),
  addBranch: (branch) => set((s) => ({ branches: [...s.branches, branch] })),
  addWarehouse: (warehouse) => set((s) => ({ warehouses: [...s.warehouses, warehouse] })),
  addCategory: (category) => set((s) => ({ categories: [...s.categories, category] })),
  addBrand: (brand) => set((s) => ({ brands: [...s.brands, brand] })),
  addSupplier: (supplier) => set((s) => ({ suppliers: [...s.suppliers, supplier] })),
}), { name: "pos-data", version: 2, migrate: () => ({}) as never }))
