import type { IndustryConfig, ModuleId, Role, Terms } from "@/lib/types"
import { can, type Permission } from "@/lib/permissions"
import {
  LayoutDashboard, Store, Package, Warehouse, ShoppingCart, Users, UserCog, BookOpen, BarChart3,
  Settings, Clock, ShieldCheck, Sparkles, Tag, Truck, Bike, Car, Timer, ClipboardList,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Any one of these lets the person see the tab. */
  permission: Permission[]
  /** The industry module that has to be switched on for the business. */
  module?: ModuleId
}

export const DEFAULT_TERMS: Terms = { pos: "POS", products: "Products", inventory: "Inventory", sales: "Sales", customers: "Customers", customer: "Customer" }

const anyOf = (...p: Permission[]) => p

/**
 * Every tab the portal can show. Which of them a person sees depends on the business's industry (modules, labels, the
 * record types it keeps) and on what their role is allowed to do.
 */
export function allNavItems(config: IndustryConfig | null): NavItem[] {
  const t = config?.terms ?? DEFAULT_TERMS
  const records: NavItem[] = (config?.recordTypes ?? []).map((r) => ({
    href: `/work/${r.key}`, label: r.plural, icon: ClipboardList, permission: anyOf("records.view"),
  }))
  return [
    { href: "/overview", label: "Dashboard", icon: LayoutDashboard, permission: anyOf("dashboard.view"), module: "dashboard" },
    { href: "/", label: t.pos, icon: Store, permission: anyOf("pos.sell"), module: "pos" },
    { href: "/deliveries", label: "Deliveries", icon: Truck, permission: anyOf("deliveries.view", "deliveries.manage", "deliveries.fulfil"), module: "deliveries" },
    { href: "/fleet", label: "Fleet", icon: Car, permission: anyOf("fleet.manage", "deliveries.manage", "deliveries.view"), module: "fleet" },
    ...records,
    { href: "/products", label: t.products, icon: Package, permission: anyOf("products.view"), module: "products" },
    { href: "/inventory", label: t.inventory, icon: Warehouse, permission: anyOf("products.view"), module: "inventory" },
    { href: "/sales", label: t.sales, icon: ShoppingCart, permission: anyOf("sales.view"), module: "sales" },
    { href: "/promotions", label: "Discounts & Promotions", icon: Tag, permission: anyOf("price.change"), module: "promotions" },
    { href: "/customers", label: t.customers, icon: Users, permission: anyOf("customers.manage"), module: "customers" },
    { href: "/insights", label: "Insights", icon: Sparkles, permission: anyOf("dashboard.view"), module: "insights" },
    { href: "/employees/shifts", label: "Shifts & Cash", icon: Clock, permission: anyOf("shift.manage"), module: "shifts" },
    { href: "/employees/hours", label: "Hours worked", icon: Timer, permission: anyOf("hours.view", "time.clock"), module: "hours" },
    { href: "/employees", label: "Staff", icon: UserCog, permission: anyOf("staff.view"), module: "staff" },
    { href: "/accounting", label: "Accounting", icon: BookOpen, permission: anyOf("expenses.manage"), module: "accounting" },
    { href: "/reports", label: "Reports", icon: BarChart3, permission: anyOf("reports.view"), module: "reports" },
    { href: "/audit", label: "Audit Log", icon: ShieldCheck, permission: anyOf("audit.view"), module: "audit" },
    { href: "/settings", label: "Settings", icon: Settings, permission: anyOf("settings.manage"), module: "settings" },
  ]
}

/** Until the server has told us the industry, every module counts as on (the server still refuses what is not allowed). */
const moduleOn = (config: IndustryConfig | null, m?: ModuleId) => !m || !config || config.modules.includes(m)

export function navFor(role: Role | undefined, config: IndustryConfig | null = null): NavItem[] {
  return allNavItems(config)
    .filter((item) => moduleOn(config, item.module) && item.permission.some((p) => can(role, p)))
    .map((item) => {
      // someone who only carries out deliveries sees "My deliveries"
      if (item.href === "/deliveries" && !can(role, "deliveries.view") && !can(role, "deliveries.manage")) return { ...item, label: "My deliveries", icon: Bike }
      if (item.href === "/employees/hours" && !can(role, "hours.view")) return { ...item, label: "My hours" }
      return item
    })
}

/** The nav item whose href is the longest match for the pathname (so /employees/shifts doesn't also light up Staff). */
export function activeHref(pathname: string, items: NavItem[]): string | undefined {
  return items
    .filter((i) => (i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href
}

interface RouteRule { prefix: string; permission: Permission[]; module?: ModuleId }

const ROUTE_RULES: RouteRule[] = [
  { prefix: "/overview", permission: ["dashboard.view"], module: "dashboard" },
  { prefix: "/insights", permission: ["dashboard.view"], module: "insights" },
  { prefix: "/audit", permission: ["audit.view"], module: "audit" },
  { prefix: "/promotions", permission: ["price.change"], module: "promotions" },
  { prefix: "/employees/shifts", permission: ["shift.manage"], module: "shifts" },
  { prefix: "/employees/hours", permission: ["hours.view", "time.clock"], module: "hours" },
  { prefix: "/employees", permission: ["staff.view"], module: "staff" },
  { prefix: "/accounting", permission: ["expenses.manage"], module: "accounting" },
  { prefix: "/reports", permission: ["reports.view"], module: "reports" },
  { prefix: "/settings", permission: ["settings.manage"], module: "settings" },
  { prefix: "/customers", permission: ["customers.manage"], module: "customers" },
  { prefix: "/sales", permission: ["sales.view"], module: "sales" },
  { prefix: "/inventory", permission: ["products.view"], module: "inventory" },
  { prefix: "/products", permission: ["products.view"], module: "products" },
  { prefix: "/categories", permission: ["products.view"], module: "products" },
  { prefix: "/deliveries", permission: ["deliveries.view", "deliveries.manage", "deliveries.fulfil"], module: "deliveries" },
  { prefix: "/fleet", permission: ["fleet.manage", "deliveries.manage", "deliveries.view"], module: "fleet" },
]

export function routeAllowed(role: Role | undefined, pathname: string, config: IndustryConfig | null = null): boolean {
  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) return !!role
  if (pathname === "/") return can(role, "pos.sell") && moduleOn(config, "pos")
  if (pathname === "/sales/new") return can(role, "pos.sell") && moduleOn(config, "pos")
  if (pathname === "/work" || pathname.startsWith("/work/")) {
    const type = pathname.split("/")[2]
    const known = !config || (!!type && config.recordTypes.some((r) => r.key === type))
    return known && can(role, "records.view")
  }
  const rule = ROUTE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"))
  // Fail closed: newly added or misspelled dashboard routes must not be public
  // to every authenticated role by default.
  if (!rule) return false
  return moduleOn(config, rule.module) && rule.permission.some((p) => can(role, p))
}

/** Where to send someone who has just signed in, or who tried a page they may not see. */
export function landingFor(role: Role | undefined, config: IndustryConfig | null = null): string {
  const items = navFor(role, config)
  if (items.some((i) => i.href === "/")) return "/"
  // before the industry is known, guess from what the role does
  if (!config) {
    if (can(role, "products.view")) return "/inventory"
    if (can(role, "deliveries.fulfil")) return "/deliveries"
    return "/employees/hours"
  }
  return items[0]?.href ?? "/employees/hours"
}
