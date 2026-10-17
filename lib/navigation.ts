import type { Role } from "@/lib/types"
import { can, type Permission } from "@/lib/permissions"
import {
  LayoutDashboard, Store, Package, Warehouse, ShoppingCart, Users, UserCog, BookOpen, BarChart3,
  Settings, Clock, ShieldCheck, Sparkles, Tag
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission: Permission
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "POS", icon: Store, permission: "pos.sell" },
  { href: "/overview", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/products", label: "Products", icon: Package, permission: "products.view" },
  { href: "/inventory", label: "Inventory", icon: Warehouse, permission: "products.view" },
  { href: "/sales", label: "Sales", icon: ShoppingCart, permission: "sales.view" },
  { href: "/promotions", label: "Promotions", icon: Tag, permission: "price.change" },
  { href: "/customers", label: "Customers", icon: Users, permission: "customers.manage" },
  { href: "/insights", label: "Insights", icon: Sparkles, permission: "dashboard.view" },
  { href: "/employees/shifts", label: "Shifts & Cash", icon: Clock, permission: "shift.manage" },
  { href: "/employees", label: "Staff", icon: UserCog, permission: "staff.view" },
  { href: "/accounting", label: "Accounting", icon: BookOpen, permission: "expenses.manage" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "/audit", label: "Audit Log", icon: ShieldCheck, permission: "audit.view" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
]

export function navFor(role: Role | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => can(role, item.permission))
}

/** The nav item whose href is the longest match for the pathname (so /employees/shifts doesn't also light up Staff). */
export function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}

const ROUTE_RULES: [string, Permission][] = [
  ["/overview", "dashboard.view"], ["/insights", "dashboard.view"], ["/audit", "audit.view"],
  ["/promotions", "price.change"], ["/employees/shifts", "shift.manage"], ["/employees", "staff.view"],
  ["/accounting", "expenses.manage"], ["/reports", "reports.view"], ["/settings", "settings.manage"],
  ["/customers", "customers.manage"], ["/sales", "sales.view"], ["/inventory", "products.view"],
  ["/products", "products.view"], ["/notifications", "shift.manage"],
]

export function routeAllowed(role: Role | undefined, pathname: string): boolean {
  if (pathname === "/" ) return can(role, "pos.sell")
  if (pathname === "/sales/new") return can(role, "pos.sell")
  const rule = ROUTE_RULES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"))
  // Fail closed: newly added or misspelled dashboard routes must not be public
  // to every authenticated role by default.
  if (!rule) return false
  if (rule[0] === "/notifications") return !!role
  return can(role, rule[1])
}

export function landingFor(role: Role | undefined): string {
  return can(role, "pos.sell") ? "/" : "/inventory"
}
