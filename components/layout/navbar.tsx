"use client"

import { useCallback, useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { BranchSwitcher, ConnectionStatus } from "@/components/layout/nav-status"
import { ROLE_LABELS, can } from "@/lib/permissions"
import { SearchInput } from "@/components/ui/search-input"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils/cn"
import {
  Menu, Bell, Search, LogOut, User,
  Settings, ChevronDown, ShoppingCart
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useKeyboardShortcut } from "@/lib/hooks/use-keyboard-shortcut"

export function Navbar() {
  const { user, logout } = useAuthStore()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { unreadCount } = useNotificationStore()
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const router = useRouter()

  const startNewSale = useCallback(() => {
    if (can(user?.role, "pos.sell")) router.push("/sales/new")
  }, [router, user?.role])

  useKeyboardShortcut("q", startNewSale, { ctrl: true })

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="relative h-14 shrink-0 bg-white shadow-sm ring-1 ring-black/5 rounded-xl lg:ring-0 flex items-center justify-between px-3 sm:px-4 lg:px-5 gap-2 sm:gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

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

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
              {user?.name?.charAt(0) || "U"}
            </div>
            <span className="hidden max-w-32 truncate whitespace-nowrap lg:block text-sm font-medium">{user?.name || "User"}</span>
            <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 anim-pop w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user ? ROLE_LABELS[user.role] : ""}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
