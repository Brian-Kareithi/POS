"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/stores/ui-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { APP_NAME } from "@/lib/constants"
import { ROLE_LABELS } from "@/lib/permissions"
import { navFor, activeHref } from "@/lib/navigation"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LogOut, X } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const navItems = navFor(user?.role)
  const current = activeHref(pathname, navItems)

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] anim-overlay lg:hidden" onClick={toggleSidebar} />
      )}
      <aside
        className={cn(
          "fixed bottom-3 left-3 top-3 z-50 w-[17rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 flex flex-col overscroll-contain transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto lg:w-60 lg:max-w-none lg:shrink-0 lg:rounded-xl lg:shadow-sm lg:ring-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2 text-base font-extrabold tracking-wide text-gray-900">
            <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#efa62a] text-[9px] text-blue-600">POS</span>
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
          <p className="text-xs text-gray-400">{user ? ROLE_LABELS[user.role] : "User"}</p>
          <p className="text-sm font-medium text-gray-700">{user?.name || ""}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar()
              }}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-medium transition-colors",
                item.href === current
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 border-t border-gray-200 p-3">
          <button
            onClick={() => {
              logout()
              router.push("/login")
            }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            Logout
          </button>
          <ThemeToggle className="shrink-0" />
        </div>

      </aside>
    </>
  )
}
