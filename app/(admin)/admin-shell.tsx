"use client"

import { useEffect, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Building2, LayoutDashboard, ScrollText, UserCog } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { landingFor } from "@/lib/navigation"
import { APP_NAME } from "@/lib/constants"
import { ShellSkeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { PlatformLogo } from "@/components/brand/brand-logo"
import { SidebarFrame, SidebarToggle } from "@/components/layout/sidebar-frame"

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/audit", label: "Activity", icon: ScrollText },
  { href: "/admin/account", label: "My account", icon: UserCog },
]

const TITLES: Record<string, string> = { "/admin": "Overview", "/admin/businesses": "Businesses", "/admin/audit": "Activity", "/admin/account": "My account" }

/** The super admin's own portal: the same floating sidebar and top bar as the business portal. It never loads a business's data. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const validated = useAuthStore((s) => s.validated)
  const logout = useAuthStore((s) => s.logout)
  const ready = useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  )
  const isAdmin = !!token && user?.role === "admin"

  useEffect(() => {
    if (!ready) return
    if (!token) router.replace("/login")
    else if (user && user.role !== "admin") router.replace(landingFor(user.role))
  }, [ready, token, user, router])

  // Check the stored session with the server once per visit, like the business portal does.
  useEffect(() => {
    if (ready && isAdmin && !validated) void useAuthStore.getState().validate()
  }, [ready, isAdmin, validated])

  if (!ready) return <ShellSkeleton />
  if (!isAdmin) return null
  if (!validated) return <ShellSkeleton />

  const current = [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(n.href + "/")))?.href
  const title = TITLES[current ?? ""] ?? "Businesses"

  return (
    <div className="flex h-dvh overflow-hidden bg-[#edf2f0] p-2 dark:bg-black lg:gap-3 lg:p-3">
      <SidebarFrame
        items={NAV}
        currentHref={current}
        homeHref="/admin"
        header={(collapsed) => (
          <>
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-black/5"><PlatformLogo className="h-8 w-8" /></span>
            <span className={collapsed ? "truncate leading-tight lg:hidden" : "truncate leading-tight"}>{APP_NAME}<span className="block text-xs font-medium text-blue-700">Super admin</span></span>
          </>
        )}
        profile={{ name: user?.name || "Super admin", subtitle: user?.email, href: "/admin/account" }}
        onLogout={() => { void logout(); router.push("/login") }}
        showTheme={false}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
        <header className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-white px-3 shadow-sm ring-1 ring-black/5 sm:px-4 lg:ring-0">
          <SidebarToggle />
          <p className="truncate text-base font-semibold text-gray-900">{title}</p>
          <span className="ml-auto hidden max-w-60 truncate text-sm text-gray-500 md:block">{user?.email}</span>
          <ThemeToggle className="ml-auto h-9 w-9 rounded-full md:ml-0" />
        </header>
        <main className="flex-1 overflow-y-auto rounded-2xl p-1 sm:p-3 lg:p-4">
          <div key={pathname} className="anim-page mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
