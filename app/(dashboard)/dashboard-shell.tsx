"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { routeAllowed, landingFor } from "@/lib/navigation"
import { notificationsFor } from "@/lib/notifications"
import { useInitializeData, reloadData } from "@/lib/hooks/use-initialize-data"
import { useNotificationStream } from "@/lib/hooks/use-notification-stream"
import { useOfflineSync } from "@/lib/hooks/use-offline-sync"
import { useDataStore } from "@/lib/stores/data-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { ShellSkeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hasToken = useAuthStore((s) => !!s.token)
  const validated = useAuthStore((s) => s.validated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated && !!s.token)
  const role = useAuthStore((s) => s.user?.role)
  const user = useAuthStore((s) => s.user)
  const industry = useDataStore((s) => s.industry)
  const allowed = routeAllowed(role, pathname, industry)
  const notifications = useDataStore((s) => s.notifications)
  const loaded = useDataStore((s) => s.loaded)
  const loadError = useDataStore((s) => s.loadError)
  const { setUnreadCount } = useNotificationStore()
  // Subscribe to persist hydration; the snapshot is re-read after subscribing so a hydration that
  // finishes between render and effect cannot be missed (which left the loading skeleton up forever).
  const ready = useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  )

  // The super admin has no business to load: they are sent to /admin below.
  const hasBusiness = isAuthenticated && role !== "admin"
  useInitializeData(ready && hasBusiness)
  useNotificationStream(ready && hasBusiness && loaded)

  // Upload any sales rung up offline: when the data is loaded, when the connection returns, and on a backing-off timer.
  useOfflineSync(loaded && hasBusiness)

  // The menu is opened by the person, never by arriving on a page: close it whenever the page changes.
  useEffect(() => { useUIStore.getState().setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login")
    }
  }, [ready, isAuthenticated, router])

  useEffect(() => {
    if (ready && isAuthenticated && !allowed) router.replace(landingFor(role, industry))
  }, [ready, isAuthenticated, allowed, role, industry, router])

  useEffect(() => {
    const unread = notificationsFor(notifications, user).filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications, user, setUnreadCount])

  if (!ready) return <ShellSkeleton />

  // No token (or one the server rejected): render nothing and go to sign-in right away.
  if (!hasToken || !isAuthenticated || !allowed) return null
  if (!validated || !loaded) return <ShellSkeleton />

  const isPos = pathname === "/"

  return (
    <div className="flex h-dvh overflow-hidden bg-[#edf2f0] p-2 dark:bg-black lg:gap-3 lg:p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
        <Navbar />
        <main className={isPos ? "min-h-0 flex-1 overflow-hidden lg:p-0" : "flex-1 overflow-y-auto rounded-xl p-2 sm:p-4 lg:p-6"}>
          {loadError && (
            <div role="alert" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <span>Some data could not be loaded: {loadError}</span>
              <button onClick={() => void reloadData()} className="font-semibold underline">Try again</button>
            </div>
          )}
          {!isPos && <Breadcrumbs />}
          <div key={pathname} className={isPos ? "anim-page h-full" : "anim-page"}>{children}</div>
        </main>
      </div>
    </div>
  )
}
