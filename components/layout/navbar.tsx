"use client"

import { useCallback, useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { BranchSwitcher, ConnectionStatus } from "@/components/layout/nav-status"
import { ClockWidget } from "@/components/layout/clock-widget"
import { ShiftShortcut } from "@/components/layout/shift-shortcut"
import { can } from "@/lib/permissions"
import { SearchInput } from "@/components/ui/search-input"
import { BusinessLogo } from "@/components/brand/brand-logo"
import { SidebarToggle } from "@/components/layout/sidebar-frame"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils/cn"
import {
  Bell, Search, ShoppingCart
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut"

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { unreadCount } = useNotificationStore()
  const [showSearch, setShowSearch] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // On the till itself, the till handles Ctrl+Q (it also has to deal with the sale in progress).
  const startNewSale = useCallback(() => {
    if (pathname !== "/" && can(user?.role, "pos.sell")) router.push("/")
  }, [router, user?.role, pathname])

  useKeyboardShortcut("q", startNewSale, { ctrl: true })

  return (
    <header className="relative h-14 shrink-0 bg-white shadow-sm ring-1 ring-black/5 rounded-xl lg:ring-0 flex items-center justify-between px-3 sm:px-4 lg:px-5 gap-2 sm:gap-4">
      <div className="flex items-center gap-3">
        <SidebarToggle />

        <Link href="/" aria-label="Home" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-black/5 lg:hidden"><BusinessLogo className="h-7 w-7" /></Link>

        <div className="hidden md:block">
          <SearchInput placeholder="Search products, sales, customers..." className="w-40 lg:w-80" />
        </div>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {showSearch && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl p-3 bg-white shadow-lg ring-1 ring-black/5 md:hidden z-30">
          <SearchInput placeholder="Search..." autoFocus />
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-2">
        <BranchSwitcher />
        <ShiftShortcut compact />
        {can(user?.role, "time.clock") && <ClockWidget />}
        <ConnectionStatus />
        {can(user?.role, "pos.sell") && <Link
          href="/sales/new"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 sm:px-4"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">New Sale</span>
        </Link>}

        <ThemeToggle className="h-9 w-9" />

        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
