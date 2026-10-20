import type { Role } from "@/lib/types"

export type Permission =
  | "pos.sell" | "sales.view" | "discount.small" | "discount.any" | "price.change"
  | "refund.issue" | "void.sale" | "products.view" | "products.edit" | "stock.edit"
  | "purchase.manage" | "customers.manage" | "expenses.manage" | "reports.view"
  | "reports.export" | "dashboard.view" | "staff.view" | "staff.manage" | "settings.manage"
  | "audit.view" | "shift.manage" | "branches.all" | "backup.manage"

const ALL: Permission[] = [
  "pos.sell", "sales.view", "discount.small", "discount.any", "price.change", "refund.issue", "void.sale",
  "products.view", "products.edit", "stock.edit", "purchase.manage", "customers.manage", "expenses.manage",
  "reports.view", "reports.export", "dashboard.view", "staff.view", "staff.manage", "settings.manage",
  "audit.view", "shift.manage", "branches.all", "backup.manage",
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  manager: ALL.filter((p) => !["staff.manage", "settings.manage", "backup.manage"].includes(p)),
  cashier: ["pos.sell", "sales.view", "discount.small", "products.view", "customers.manage", "shift.manage"],
  stockkeeper: ["products.view", "products.edit", "stock.edit", "purchase.manage"],
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner / Director",
  manager: "Manager",
  cashier: "Cashier",
  stockkeeper: "Stockkeeper",
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control, including staff, settings and backups.",
  manager: "Runs the shop: approvals, prices, refunds, stock, reports.",
  cashier: "Fast checkout, small discounts, customers and own shift.",
  stockkeeper: "Products, stock counts, purchase orders and goods received.",
}

/** A cashier may give up to this discount without a manager's approval. */
export const CASHIER_DISCOUNT_LIMIT_PERCENT = 5

/** Staff who registered themselves can't sign in or appear on the team until the owner approves them. */
export function isApproved(employee: { approval?: "pending" | "approved" | "rejected" }): boolean {
  return !employee.approval || employee.approval === "approved"
}

export function can(role: Role | undefined, permission: Permission): boolean {
  return typeof role === "string" && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)
    && ROLE_PERMISSIONS[role].includes(permission)
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  "pos.sell": "Make sales at the till",
  "sales.view": "View sales history and receipts",
  "discount.small": "Give small discounts",
  "discount.any": "Give any discount",
  "price.change": "Change selling prices",
  "refund.issue": "Issue refunds and voids",
  "void.sale": "Void sales",
  "products.view": "View products",
  "products.edit": "Add and edit products",
  "stock.edit": "Edit stock levels",
  "purchase.manage": "Purchase orders and goods received",
  "customers.manage": "Manage customers",
  "expenses.manage": "Record expenses",
  "reports.view": "View reports",
  "reports.export": "Export reports",
  "dashboard.view": "View the business dashboard",
  "staff.view": "View staff",
  "staff.manage": "Add and change staff roles",
  "settings.manage": "Change settings",
  "audit.view": "View the audit log",
  "shift.manage": "Open and close own shift",
  "branches.all": "See all branches",
  "backup.manage": "Backups, restore and data export",
}
