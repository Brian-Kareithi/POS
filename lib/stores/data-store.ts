import { create } from "zustand"
import type {
  Business, Branch, Warehouse, Category, Brand, Supplier,
  Product, Customer, CustomerGroup, Employee, Notification,
  Sale, PurchaseOrder, StockTransfer, Transaction
} from "@/lib/types"

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
  employees: Employee[]
  notifications: Notification[]
  sales: Sale[]
  purchaseOrders: PurchaseOrder[]
  stockTransfers: StockTransfer[]
  transactions: Transaction[]
  setBusiness: (business: Business) => void
  setBranches: (branches: Branch[]) => void
  setWarehouses: (warehouses: Warehouse[]) => void
  setCategories: (categories: Category[]) => void
  setBrands: (brands: Brand[]) => void
  setSuppliers: (suppliers: Supplier[]) => void
  setProducts: (products: Product[]) => void
  setCustomers: (customers: Customer[]) => void
  setCustomerGroups: (groups: CustomerGroup[]) => void
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
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addTransaction: (transaction: Transaction) => void
  addPurchaseOrder: (order: PurchaseOrder) => void
  addStockTransfer: (transfer: StockTransfer) => void
  addCustomer: (customer: Customer) => void
  updateCustomer: (id: string, updates: Partial<Customer>) => void
  addEmployee: (employee: Employee) => void
  addBranch: (branch: Branch) => void
  addWarehouse: (warehouse: Warehouse) => void
  addCategory: (category: Category) => void
  addBrand: (brand: Brand) => void
  addSupplier: (supplier: Supplier) => void
}

export const useDataStore = create<DataState>()((set) => ({
  business: null,
  branches: [],
  warehouses: [],
  categories: [],
  brands: [],
  suppliers: [],
  products: [],
  customers: [],
  customerGroups: [],
  employees: [],
  notifications: [],
  sales: [],
  purchaseOrders: [],
  stockTransfers: [],
  transactions: [],

  setBusiness: (business) => set({ business }),
  setBranches: (branches) => set({ branches }),
  setWarehouses: (warehouses) => set({ warehouses }),
  setCategories: (categories) => set({ categories }),
  setBrands: (brands) => set({ brands }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setProducts: (products) => set({ products }),
  setCustomers: (customers) => set({ customers }),
  setCustomerGroups: (groups) => set({ customerGroups: groups }),
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
}))
