"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { routeAllowed, landingFor } from "@/lib/navigation"
import { useInitializeData } from "@/lib/hooks/use-initialize-data"
import { useDataStore } from "@/lib/stores/data-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { Skeleton, DashboardSkeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { BottomNav } from "@/components/layout/bottom-nav"
import { MobileNav } from "@/components/layout/mobile-nav"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.user?.role)
  const allowed = routeAllowed(role, pathname)
  const { notifications } = useDataStore()
  const { setUnreadCount } = useNotificationStore()
  const [ready, setReady] = useState(() => useAuthStore.persist?.hasHydrated() ?? false)

  useInitializeData()

  useEffect(() => {
    return useAuthStore.persist?.onFinishHydration(() => setReady(true))
  }, [])

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.push("/login")
    }
  }, [ready, isAuthenticated, router])

  useEffect(() => {
    if (ready && isAuthenticated && !allowed) router.replace(landingFor(role))
  }, [ready, isAuthenticated, allowed, role, router])

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications, setUnreadCount])

  if (!ready) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="hidden lg:flex w-64 border-r border-gray-200 bg-white p-6 flex-col gap-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2 mt-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !allowed) return null

  const isPos = pathname === "/"

  return (
    <div className="flex h-dvh overflow-hidden bg-[#edf2f0] p-0 dark:bg-black lg:gap-3 lg:p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:gap-3">
        <Navbar />
        <main className={isPos ? "min-h-0 flex-1 overflow-hidden p-2 pb-16 lg:p-0" : "flex-1 overflow-y-auto p-4 pb-20 lg:rounded-xl lg:p-6 lg:pb-6"}>
          {!isPos && <Breadcrumbs />}
          {children}
        </main>
      </div>
      <BottomNav />
      <MobileNav />
    </div>
  )
}
