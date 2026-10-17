"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils/cn"
import { navFor, activeHref } from "@/lib/navigation"

const PRIMARY = ["/", "/overview", "/products", "/inventory", "/sales", "/customers"]

export function BottomNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const all = navFor(user?.role)
  const items = all.filter((i) => PRIMARY.includes(i.href)).slice(0, 5)
  const current = activeHref(pathname, all)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = item.href === current
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
