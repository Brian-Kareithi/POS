export interface User {
  id: string
  email: string
  name: string
  role: Role
  businessId: string
  branchId?: string
  avatar?: string
  phone?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type Role =
  | "super_admin"
  | "business_owner"
  | "branch_manager"
  | "cashier"
  | "inventory_manager"
  | "accountant"
  | "customer"
  | "self_checkout"

export interface Business {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  address: string
  currency: string
  timezone: string
  createdAt: string
}

export interface Branch {
  id: string
  businessId: string
  name: string
  address: string
  phone: string
  email: string
  managerId?: string
  isActive: boolean
  createdAt: string
}

export interface Warehouse {
  id: string
  businessId: string
  branchId?: string
  name: string
  address: string
  isActive: boolean
  createdAt: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  slug: string
  description?: string
  parentId?: string
  isActive: boolean
  createdAt: string
}

export interface Brand {
  id: string
  businessId: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  createdAt: string
}

export interface Supplier {
  id: string
  businessId: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  isActive: boolean
  createdAt: string
}

export interface Product {
  id: string
  businessId: string
  categoryId: string
  brandId?: string
  supplierId?: string
  name: string
  slug: string
  sku: string
  barcode: string
  description?: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  unit: string
  minStock: number
  maxStock: number
  isActive: boolean
  hasVariants: boolean
  image?: string
  category?: Category
  brand?: Brand
  supplier?: Supplier
  variants?: ProductVariant[]
  createdAt: string
  updatedAt: string
}

export interface ProductVariant {
  id: string
  productId: string
  name: string
  sku: string
  barcode: string
  costPrice: number
  sellingPrice: number
  stock: number
  isActive: boolean
}

export interface Inventory {
  id: string
  productId: string
  warehouseId: string
  branchId?: string
  quantity: number
  minStock: number
  maxStock: number
  product?: Product
  warehouse?: Warehouse
  branch?: Branch
}

export interface StockTransfer {
  id: string
  businessId: string
  fromWarehouseId: string
  toWarehouseId: string
  productId: string
  quantity: number
  status: "pending" | "approved" | "completed" | "cancelled"
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  businessId: string
  supplierId: string
  warehouseId: string
  orderNumber: string
  status: "draft" | "pending" | "approved" | "received" | "cancelled"
  total: number
  notes?: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  productId: string
  quantity: number
  received: number
  unitPrice: number
  total: number
  product?: Product
}

export interface Customer {
  id: string
  businessId: string
  name: string
  email: string
  phone: string
  address?: string
  groupId?: string
  loyaltyPoints: number
  storeCredit: number
  notes?: string
  birthday?: string
  isActive: boolean
  createdAt: string
  group?: CustomerGroup
}

export interface CustomerGroup {
  id: string
  businessId: string
  name: string
  discountPercent: number
  isActive: boolean
}

export interface Sale {
  id: string
  businessId: string
  branchId: string
  customerId?: string
  userId: string
  orderNumber: string
  status: "pending" | "completed" | "refunded" | "cancelled"
  subtotal: number
  taxTotal: number
  discountTotal: number
  total: number
  paidAmount: number
  changeAmount: number
  paymentMethod: PaymentMethod
  notes?: string
  items?: SaleItem[]
  payments?: Payment[]
  customer?: Customer
  user?: User
  createdAt: string
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  discount: number
  tax: number
  total: number
  product?: Product
}

export interface Payment {
  id: string
  saleId: string
  method: PaymentMethod
  amount: number
  reference?: string
  status: "pending" | "completed" | "failed" | "refunded"
  createdAt: string
}

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "mobile_money"

export interface Coupon {
  id: string
  businessId: string
  code: string
  type: "percentage" | "fixed"
  value: number
  minPurchase: number
  maxUses: number
  usedCount: number
  expiresAt: string
  isActive: boolean
}

export interface GiftCard {
  id: string
  businessId: string
  code: string
  balance: number
  initialBalance: number
  customerId?: string
  expiresAt: string
  isActive: boolean
}

export interface Employee {
  id: string
  userId: string
  businessId: string
  branchId?: string
  role: Role
  salary?: number
  hireDate: string
  isActive: boolean
  user?: User
}

export interface Shift {
  id: string
  employeeId: string
  branchId: string
  startTime: string
  endTime?: string
  status: "active" | "completed" | "cancelled"
}

export interface Transaction {
  id: string
  businessId: string
  branchId?: string
  type: "income" | "expense"
  category: string
  amount: number
  description: string
  reference?: string
  date: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  link?: string
  createdAt: string
}

export interface ApiKey {
  id: string
  businessId: string
  name: string
  key: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface Report {
  id: string
  businessId: string
  type: string
  name: string
  data: unknown
  dateRange: { from: string; to: string }
  createdAt: string
}

export interface DashboardStats {
  salesToday: number
  salesWeek: number
  salesMonth: number
  revenue: number
  expenses: number
  profit: number
  inventoryValue: number
  lowStockCount: number
  bestSellingProducts: { product: Product; quantity: number; revenue: number }[]
  recentSales: Sale[]
  recentCustomers: Customer[]
  staffPerformance: { user: User; sales: number; revenue: number }[]
  branchComparison: { branch: Branch; sales: number; revenue: number }[]
  revenueData: { date: string; revenue: number; expenses: number; profit: number }[]
  taxSummary: { rate: number; collected: number }[]
}
