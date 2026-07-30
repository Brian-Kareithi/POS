"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { SearchInput } from "@/components/ui/search-input"
import { cn } from "@/lib/utils/cn"
import {
  Menu, Moon, Sun, Bell, Search, LogOut, User,
  Settings, ChevronDown, ShoppingCart
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme, toggleSidebar } = useUIStore()
  const { unreadCount } = useNotificationStore()
  const [showProfile, setShowProfile] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:block">
          <SearchInput placeholder="Search products, sales, customers..." className="w-80" />
        </div>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {showSearch && (
        <div className="absolute top-16 left-0 right-0 p-4 bg-white border-b border-gray-200 md:hidden z-30">
          <SearchInput placeholder="Search..." autoFocus />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Link
          href="/sales/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">New Sale</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

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
            <span className="hidden lg:block text-sm font-medium">{user?.name || "User"}</span>
            <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role?.replace("_", " ")}</p>
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
