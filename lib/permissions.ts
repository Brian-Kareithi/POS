import type { Role } from "@/lib/types"

export type Permission =
  | "pos.sell" | "sales.view" | "discount.small" | "discount.any" | "price.change"
  | "refund.issue" | "void.sale" | "products.view" | "products.edit" | "stock.edit"
  | "purchase.manage" | "customers.manage" | "expenses.manage" | "reports.view"
  | "reports.export" | "dashboard.view" | "staff.view" | "staff.manage" | "settings.manage"
  | "audit.view" | "shift.manage" | "branches.all" | "backup.manage"
  | "deliveries.view" | "deliveries.manage" | "deliveries.load" | "deliveries.fulfil" | "fleet.manage"
  | "records.view" | "records.manage" | "time.clock" | "hours.view" | "hours.manage"

const ALL: Permission[] = [
  "pos.sell", "sales.view", "discount.small", "discount.any", "price.change", "refund.issue", "void.sale",
  "products.view", "products.edit", "stock.edit", "purchase.manage", "customers.manage", "expenses.manage",
  "reports.view", "reports.export", "dashboard.view", "staff.view", "staff.manage", "settings.manage",
  "audit.view", "shift.manage", "branches.all", "backup.manage",
  "deliveries.view", "deliveries.manage", "deliveries.load", "deliveries.fulfil", "fleet.manage",
  "records.view", "records.manage", "time.clock", "hours.view", "hours.manage",
]

const SELLER: Permission[] = ["pos.sell", "sales.view", "discount.small", "products.view", "customers.manage", "shift.manage", "time.clock"]

// Mirrors src/auth/permissions.ts on the server, which is the one that actually enforces. This copy only decides what to show.
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // the owner never clocks in: they work whenever they need to, so their hours are not tracked
  owner: ALL.filter((p) => p !== "time.clock"),
  manager: ALL.filter((p) => !["staff.manage", "settings.manage", "backup.manage", "deliveries.fulfil", "hours.manage"].includes(p)),
  cashier: [...SELLER, "records.view", "records.manage"],
  stockkeeper: ["products.view", "products.edit", "stock.edit", "purchase.manage", "deliveries.view", "deliveries.load", "records.view", "time.clock"],
  dispatcher: ["products.view", "sales.view", "customers.manage", "deliveries.view", "deliveries.manage", "deliveries.load", "records.view", "records.manage", "time.clock"],
  rider: ["deliveries.fulfil", "time.clock"],
  driver: ["deliveries.fulfil", "time.clock"],
  warehouse_clerk: ["products.view", "products.edit", "stock.edit", "purchase.manage", "deliveries.view", "deliveries.load", "records.view", "records.manage", "time.clock"],
  waiter: [...SELLER, "records.view", "records.manage"],
  kitchen: ["products.view", "stock.edit", "records.view", "records.manage", "time.clock"],
  stylist: [...SELLER, "records.view", "records.manage"],
  pharmacist: [...SELLER, "products.edit", "stock.edit", "records.view", "records.manage"],
  technician: ["products.view", "customers.manage", "records.view", "records.manage", "time.clock"],
  instructor: ["customers.manage", "records.view", "records.manage", "time.clock"],
  front_desk: [...SELLER, "records.view", "records.manage"],
  admin: [],
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner / Director",
  manager: "Manager",
  cashier: "Cashier",
  stockkeeper: "Stockkeeper",
  dispatcher: "Dispatcher",
  rider: "Rider / Courier",
  driver: "Driver",
  warehouse_clerk: "Warehouse clerk",
  waiter: "Waiter / Server",
  kitchen: "Kitchen / Bar",
  stylist: "Stylist / Therapist",
  pharmacist: "Pharmacist",
  technician: "Technician / Mechanic",
  instructor: "Instructor / Teacher",
  front_desk: "Front desk / Receptionist",
  admin: "Super admin",
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full control, including staff, settings and backups.",
  manager: "Runs the business: approvals, prices, refunds, stock, reports.",
  cashier: "Fast checkout, small discounts, customers and own shift.",
  stockkeeper: "Products, stock counts, purchase orders and goods received.",
  dispatcher: "Creates deliveries, assigns riders and vehicles, follows every trip.",
  rider: "Sees only their own deliveries; confirms what was loaded and what was handed over.",
  driver: "Drives a van or truck on assigned deliveries; confirms loads and drop-offs.",
  warehouse_clerk: "Receives, picks, packs and loads goods; checks nothing is missing.",
  waiter: "Takes orders and payments at the table or counter.",
  kitchen: "Sees and updates the orders to prepare.",
  stylist: "Serves clients, takes bookings and payments.",
  pharmacist: "Dispenses, verifies prescriptions and keeps the controlled-drugs register.",
  technician: "Works on assigned jobs and work orders.",
  instructor: "Handles classes, students and their records.",
  front_desk: "Greets customers, books, checks in and takes payments.",
  admin: "Runs the platform: businesses, accounts and access.",
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
  "deliveries.view": "See all deliveries",
  "deliveries.manage": "Create and assign deliveries",
  "deliveries.load": "Confirm what is loaded onto a vehicle",
  "deliveries.fulfil": "Carry out their own deliveries",
  "fleet.manage": "Manage vehicles",
  "records.view": "See bookings, orders and jobs",
  "records.manage": "Create and update bookings, orders and jobs",
  "time.clock": "Clock in and out",
  "hours.view": "See everyone's hours worked",
  "hours.manage": "Correct hours worked",
}
