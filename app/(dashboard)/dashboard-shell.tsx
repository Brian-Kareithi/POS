"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { routeAllowed, landingFor } from "@/lib/navigation"
import { notificationsFor } from "@/lib/notifications"
import { useInitializeData } from "@/lib/hooks/use-initialize-data"
import { useDataStore } from "@/lib/stores/data-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { ShellSkeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.user?.role)
  const user = useAuthStore((s) => s.user)
  const allowed = routeAllowed(role, pathname)
  const { notifications } = useDataStore()
  const { setUnreadCount } = useNotificationStore()
  // Subscribe to persist hydration; the snapshot is re-read after subscribing so a hydration that
  // finishes between render and effect cannot be missed (which left the loading skeleton up forever).
  const ready = useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  )

  useInitializeData()

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.push("/login")
    }
  }, [ready, isAuthenticated, router])

  useEffect(() => {
    if (ready && isAuthenticated && !allowed) router.replace(landingFor(role))
  }, [ready, isAuthenticated, allowed, role, router])

  useEffect(() => {
    const unread = notificationsFor(notifications, user).filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications, user, setUnreadCount])

  if (!ready) return <ShellSkeleton />

  if (!isAuthenticated || !allowed) return null

  const isPos = pathname === "/"

  return (
    <div className="flex h-dvh overflow-hidden bg-[#edf2f0] p-2 dark:bg-black lg:gap-3 lg:p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
        <Navbar />
        <main className={isPos ? "min-h-0 flex-1 overflow-hidden lg:p-0" : "flex-1 overflow-y-auto rounded-xl p-2 sm:p-4 lg:p-6"}>
          {!isPos && <Breadcrumbs />}
          <div key={pathname} className={isPos ? "anim-page h-full" : "anim-page"}>{children}</div>
        </main>
      </div>
    </div>
  )
}
