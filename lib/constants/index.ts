export const APP_NAME = "This POS System"

export const ROLES = [
  { value: "owner", label: "Owner / Director" },
  { value: "sales_person", label: "Sales Person" },
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
  { value: "KES", label: "Kenyan Shilling (KSh)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
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
  { href: "/", label: "Dashboard", icon: "LayoutDashboard", roles: ["owner"] },
  { href: "/products", label: "Products", icon: "Package", roles: ["owner", "sales_person"] },
  { href: "/inventory", label: "Inventory", icon: "Warehouse", roles: ["owner"] },
  { href: "/sales", label: "Sales", icon: "ShoppingCart", roles: ["owner", "sales_person"] },
  { href: "/customers", label: "Customers", icon: "Users", roles: ["owner"] },
  { href: "/employees", label: "Employees", icon: "UserCog", roles: ["owner"] },
  { href: "/accounting", label: "Accounting", icon: "BookOpen", roles: ["owner"] },
  { href: "/reports", label: "Reports", icon: "BarChart3", roles: ["owner"] },
  { href: "/settings", label: "Settings", icon: "Settings", roles: ["owner"] },
] as const
