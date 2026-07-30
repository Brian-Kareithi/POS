"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useInitializeData } from "@/lib/hooks/use-initialize-data"
import { useDataStore } from "@/lib/stores/data-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { BottomNav } from "@/components/layout/bottom-nav"
import { MobileNav } from "@/components/layout/mobile-nav"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const { notifications } = useDataStore()
  const { setUnreadCount } = useNotificationStore()

  useInitializeData()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications, setUnreadCount])

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <BottomNav />
      <MobileNav />
    </div>
  )
}
