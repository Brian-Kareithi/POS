export const APP_NAME = "This POS System"

export const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "business_owner", label: "Business Owner" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "inventory_manager", label: "Inventory Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "customer", label: "Customer" },
  { value: "self_checkout", label: "Self Checkout User" },
] as const

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
] as const

export const SALE_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const ORDER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const STOCK_TRANSFER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const

export const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
] as const

export const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "KES", label: "Kenyan Shilling (KSh)" },
  { value: "NGN", label: "Nigerian Naira (₦)" },
] as const

export const TAX_RATES = [
  { value: 0, label: "0%" },
  { value: 5, label: "5%" },
  { value: 8, label: "8%" },
  { value: 10, label: "10%" },
  { value: 16, label: "16%" },
  { value: 20, label: "20%" },
] as const

export const UNITS = [
  { value: "piece", label: "Piece" },
  { value: "kg", label: "Kilogram" },
  { value: "g", label: "Gram" },
  { value: "l", label: "Liter" },
  { value: "ml", label: "Milliliter" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "carton", label: "Carton" },
] as const

export const SIDEBAR_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/products", label: "Products", icon: "Package" },
  { href: "/inventory", label: "Inventory", icon: "Warehouse" },
  { href: "/sales", label: "Sales", icon: "ShoppingCart" },
  { href: "/customers", label: "Customers", icon: "Users" },
  { href: "/employees", label: "Employees", icon: "UserCog" },
  { href: "/accounting", label: "Accounting", icon: "BookOpen" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const
