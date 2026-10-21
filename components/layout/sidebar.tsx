"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { APP_NAME } from "@/lib/constants"
import { ROLE_LABELS, can } from "@/lib/permissions"
import { navFor, activeHref } from "@/lib/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { BusinessLogo } from "@/components/brand/brand-logo"
import { SidebarFrame } from "@/components/layout/sidebar-frame"

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()

  const pendingStaff = useDataStore((s) => s.employees.filter((e) => e.approval === "pending").length)
  const industry = useDataStore((s) => s.industry)
  const businessName = useDataStore((s) => s.business?.name)
  const navItems = navFor(user?.role, industry)

  return (
    <SidebarFrame
      items={navItems.map((i) => ({ href: i.href, label: i.label, icon: i.icon, badge: i.href === "/employees" ? pendingStaff : undefined }))}
      currentHref={activeHref(pathname, navItems)}
      homeHref="/"
      header={(collapsed) => (
        <>
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-black/5"><BusinessLogo className="h-8 w-8" /></span>
          <span className={collapsed ? "truncate lg:hidden" : "truncate"}>{businessName ?? APP_NAME}</span>
        </>
      )}
      profile={{
        name: user?.name || "User",
        subtitle: user ? (industry?.roles.find((r) => r.role === user.role)?.label ?? ROLE_LABELS[user.role]) : undefined,
        href: can(user?.role, "settings.manage") ? "/settings" : undefined,
      }}
      onLogout={() => { void logout(); router.push("/login") }}
    />
  )
}
