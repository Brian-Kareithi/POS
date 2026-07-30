"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Users,
  UserCog, BookOpen, BarChart3, Settings, X, Menu
} from "lucide-react"

const allNavItems = [
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

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role || "sales_person"))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto pb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-900">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-4 pt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
