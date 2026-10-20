"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { routeAllowed, landingFor } from "@/lib/navigation"
import { notificationsFor } from "@/lib/notifications"
import { useInitializeData, reloadData } from "@/lib/hooks/use-initialize-data"
import { useNotificationStream } from "@/lib/hooks/use-notification-stream"
import { syncPendingSales } from "@/lib/services/checkout"
import { useDataStore } from "@/lib/stores/data-store"
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
  const allowed = routeAllowed(role, pathname)
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

  useInitializeData(ready && isAuthenticated)
  useNotificationStream(ready && isAuthenticated && loaded)

  // Upload any sales rung up offline as soon as the data is loaded or the connection returns.
  useEffect(() => {
    if (!loaded) return
    void syncPendingSales()
    const online = () => void syncPendingSales()
    window.addEventListener("online", online)
    return () => window.removeEventListener("online", online)
  }, [loaded])

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login")
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
