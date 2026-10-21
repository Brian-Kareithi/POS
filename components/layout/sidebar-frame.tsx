"use client"

import Link from "next/link"
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/stores/ui-store"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export interface SidebarEntry {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** a count shown on the entry (pending requests, for example) */
  badge?: number
}

interface FrameProps {
  items: SidebarEntry[]
  currentHref?: string
  /** logo and name at the top; `collapsed` is true when only icons are showing */
  header: (collapsed: boolean) => React.ReactNode
  /** who is signed in, shown under the header while the sidebar is wide */
  who?: React.ReactNode
  homeHref: string
  onLogout: () => void
  /** the signed-in person, shown above Logout; with an href it links to their account or settings */
  profile?: { name: string; subtitle?: string; href?: string }
  /** the light/dark switch lives in the sidebar by default; a portal that puts it in its top bar passes false */
  showTheme?: boolean
}

/**
 * The floating sidebar shared by the business portal and the super-admin portal.
 * Wide screens: it sits beside the content and can shrink to icons. Phones: it slides in as a drawer from the hamburger.
 */
export function SidebarFrame({ items, currentHref, header, who, homeHref, onLogout, showTheme = true, profile }: FrameProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  // labels hide only on wide screens when collapsed; the phone drawer always shows them
  const hideWhenCollapsed = collapsed ? "lg:hidden" : ""

  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] anim-overlay lg:hidden" onClick={toggleSidebar} />}
      <aside
        aria-label="Main menu"
        className={cn(
          "fixed bottom-3 left-3 top-3 z-50 flex w-[17rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden overscroll-contain rounded-3xl bg-white shadow-xl ring-1 ring-black/5 transition-[transform,width] duration-200 lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:translate-x-0",
          collapsed ? "lg:w-[4.75rem]" : "lg:w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-[110%]",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center justify-between border-b border-gray-200 pl-6 pr-3", collapsed && "lg:justify-center lg:px-2")}>
          <Link href={homeHref} className="flex min-w-0 items-center gap-2.5 text-base font-extrabold tracking-wide text-gray-900">{header(collapsed)}</Link>
          <button onClick={toggleSidebar} aria-label="Close menu" className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"><X className="h-5 w-5" /></button>
        </div>

        {who && <div className={cn("border-b border-gray-100 px-6 py-3", hideWhenCollapsed)}>{who}</div>}

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => { if (window.innerWidth < 1024) toggleSidebar() }}
              className={cn(
                "relative flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                collapsed && "lg:justify-center lg:px-0",
                item.href === currentHref ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-blue-50 hover:text-blue-700",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn("truncate", hideWhenCollapsed)}>{item.label}</span>
              {!!item.badge && item.badge > 0 && (
                <span aria-label={`${item.badge} pending`} className={cn("ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white", collapsed && "lg:absolute lg:right-1.5 lg:top-0.5 lg:ml-0")}>{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-2">
        {profile && <ProfileChip profile={profile} collapsed={collapsed} />}
        <div className={cn("flex items-center gap-1", collapsed && "lg:flex-col")}>
          <button
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50", collapsed && "lg:w-full lg:flex-none lg:justify-center lg:px-0")}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={hideWhenCollapsed}>Logout</span>
          </button>
          {showTheme && <ThemeToggle className="shrink-0" />}
        </div>
        </div>
      </aside>
    </>
  )
}

function ProfileChip({ profile, collapsed }: { profile: NonNullable<FrameProps["profile"]>; collapsed: boolean }) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">{profile.name.trim().charAt(0).toUpperCase() || "U"}</span>
      <span className={cn("min-w-0 flex-1 text-left", collapsed && "lg:hidden")}>
        <span className="block truncate text-sm font-medium text-gray-900">{profile.name}</span>
        {profile.subtitle && <span className="block truncate text-xs text-gray-500">{profile.subtitle}</span>}
      </span>
    </>
  )
  const cls = cn("mb-1 flex items-center gap-3 rounded-full px-3 py-2", collapsed && "lg:justify-center lg:px-0")
  return profile.href
    ? <Link href={profile.href} title={collapsed ? profile.name : undefined} className={cn(cls, "transition-colors hover:bg-gray-100")}>{body}</Link>
    : <div className={cls}>{body}</div>
}

/** For the top bar: a hamburger on phones (opens the drawer), a collapse/expand control on wide screens. */
export function SidebarToggle() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleCollapsed = useUIStore((s) => s.toggleSidebarCollapsed)
  return (
    <>
      <button onClick={toggleSidebar} aria-label="Open menu" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"><Menu className="h-5 w-5" /></button>
      <button onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:block">
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>
    </>
  )
}
