"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { APP_NAME } from "@/lib/constants"
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Users,
  UserCog, BookOpen, BarChart3, Settings, ChevronLeft, X
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const allNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["owner"] },
  { href: "/products", label: "Products", icon: Package, roles: ["owner", "sales_person"] },
  { href: "/inventory", label: "Inventory", icon: Warehouse, roles: ["owner"] },
  { href: "/sales", label: "Sales", icon: ShoppingCart, roles: ["owner", "sales_person"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["owner"] },
  { href: "/employees", label: "Employees", icon: UserCog, roles: ["owner"] },
  { href: "/accounting", label: "Accounting", icon: BookOpen, roles: ["owner"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["owner"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const user = useAuthStore((s) => s.user)

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role || "sales_person")
  )

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/" className="text-lg font-bold text-gray-900">
            {APP_NAME}
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-400 capitalize">{user?.role?.replace("_", " ") || "User"}</p>
          <p className="text-sm font-medium text-gray-700">{user?.name || ""}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar()
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {user?.role === "owner" && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 w-full px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Collapse
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
