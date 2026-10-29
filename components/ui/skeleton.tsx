"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/stores/ui-store"

/** The shapes below follow the live design: rounded-xl cards, inputs and buttons, pill menu items, a floating sidebar and top bar. */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-gray-200/70 dark:bg-white/10", className)}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Stat cards like the real ones: label, big number and change on the left, icon tile on the right. One across on phones, two from sm, three on xl. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
          <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

/** Table placeholder. Columns past the second hide on phones, matching how tables scroll/collapse there. */
export function SkeletonTable({ rows = 5, cols = 4, bordered = true }: { rows?: number; cols?: number; bordered?: boolean }) {
  const cell = (j: number) => cn("h-4 flex-1", j > 1 && "hidden sm:block")
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("divide-y divide-gray-100 bg-white", bordered && "overflow-hidden rounded-xl border border-gray-200")}
    >
      <div className="flex gap-4 px-4 py-4 sm:px-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn(cell(i), "h-3")} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cell(j)} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** A list of rows: a round avatar or icon, two lines of text, and a pill on the right. */
export function ListSkeleton({ rows = 5, bordered = true, className }: { rows?: number; bordered?: boolean; className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={cn("divide-y divide-gray-100 bg-white", bordered && "overflow-hidden rounded-xl border border-gray-200", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** Labelled fields stacked in a card, ending in a pill button: settings pages and forms. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-4 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function PageHeaderSkeleton({ action }: { action?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Skeleton className="h-7 w-44 sm:h-8 sm:w-56" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full sm:w-80" />
      </div>
      {action && <Skeleton className="h-10 w-48 max-w-full shrink-0 rounded-lg" />}
    </div>
  )
}

/** A whole page of cards in a list: heading plus rows. For list pages that fetch their own data. */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <PageHeaderSkeleton />
      <ListSkeleton rows={rows} />
    </div>
  )
}

/** The detail page of one record: title block, a row of numbers, then a list. */
export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-9 w-28" />
      <div className="space-y-3 rounded-xl border border-gray-200 bg-white px-6 py-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <StatGridSkeleton />
      <ListSkeleton rows={4} />
    </div>
  )
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <Skeleton className="h-4" style={{ width }} />
}

function SkeletonPanel({ height = "h-60" }: { height?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="space-y-2 border-b border-gray-100 px-4 py-4 sm:px-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      <div className="px-4 py-4 sm:px-6"><Skeleton className={cn("w-full", height)} /></div>
    </div>
  )
}

/** Page-content placeholder, drawn like the overview: heading and period tabs, stat cards, a wide chart beside a smaller one, then two lists. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action />
      <StatGridSkeleton count={6} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><SkeletonPanel height="h-52 sm:h-72" /></div>
        <SkeletonPanel />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonPanel height="h-40" />
        <SkeletonPanel height="h-40" />
      </div>
    </div>
  )
}

/** The sale screen: search bar and buttons, category tiles, a grid of small product cards, and the Current Sale panel. */
export function PosSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex h-full min-h-0 gap-2 lg:gap-3">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-pos-canvas">
        <div className="flex h-[54px] shrink-0 items-center gap-2 border-b border-pos-tile bg-white px-4">
          <Skeleton className="h-9 max-w-[420px] flex-1 rounded-lg" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-9 w-9 rounded-lg sm:w-20" />
            <Skeleton className="h-9 w-9 rounded-lg sm:w-32" />
          </div>
        </div>
        <div className="flex shrink-0 px-4 pt-3">
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
        <div className="flex shrink-0 gap-2 overflow-hidden px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex min-w-[82px] flex-col items-start gap-2 rounded-lg bg-white px-3 py-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-2 w-8" />
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white p-2 shadow-sm">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="mt-1.5 h-3 w-4/5" />
                <Skeleton className="mt-1 h-3 w-3/5" />
                <div className="mt-1 flex items-center justify-between"><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-14" /></div>
                <Skeleton className="mt-1.5 h-7 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden w-[min(340px,38vw)] shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm md:flex">
        <div className="flex h-[60px] shrink-0 items-center border-b border-pos-line px-4">
          <div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-2.5 w-32" /></div>
        </div>
        <div className="mx-4 mt-3 grid shrink-0 grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[52px] rounded-lg" />)}
        </div>
        <div className="flex-1 p-4"><Skeleton className="mx-auto mt-16 h-3 w-48" /></div>
        <div className="shrink-0 space-y-3 border-t border-pos-line p-4">
          <Skeleton className="h-[88px] rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * Full app-shell placeholder shown while the session loads, drawn like the real shell: a solid floating sidebar
 * (logo and name, menu pills, then the profile chip above Logout), a floating top bar (menu button, search, New Sale, theme, bell),
 * and a page. It follows the saved collapsed/expanded sidebar, and on a phone shows the hamburger and logo instead of the sidebar.
 */
export function ShellSkeleton() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const isPos = usePathname() === "/"
  return (
    <div className="flex h-dvh overflow-hidden bg-[#edf2f0] p-2 dark:bg-black lg:gap-3 lg:p-3">
      <div className={cn("hidden shrink-0 flex-col overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 lg:flex", collapsed ? "w-[4.75rem]" : "w-60")}>
        <div className={cn("flex h-16 items-center gap-2.5 border-b border-gray-200", collapsed ? "justify-center" : "pl-6 pr-3")}>
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
          {!collapsed && <Skeleton className="h-5 w-28" />}
        </div>
        <div className="flex-1 space-y-1 px-2 py-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-10 rounded-full", collapsed ? "mx-auto w-10" : "w-full")} />
          ))}
        </div>
        <div className="space-y-1 border-t border-gray-200 p-2">
          <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center px-0")}>
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            {!collapsed && <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-20" /></div>}
          </div>
          <Skeleton className={cn("h-10 rounded-full", collapsed ? "mx-auto w-10" : "w-full")} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
        <div className="flex h-14 shrink-0 items-center gap-3 rounded-xl bg-white px-3 shadow-sm ring-1 ring-black/5 sm:px-4 lg:px-5 lg:ring-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl lg:hidden" />
          <Skeleton className="hidden h-9 w-40 md:block lg:w-80" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg md:hidden" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Skeleton className="h-9 w-9 rounded-lg sm:w-28" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
        <div className={cn("min-h-0 flex-1 overflow-hidden", !isPos && "rounded-xl p-2 sm:p-4 lg:p-6")}>
          {isPos ? <PosSkeleton /> : <DashboardSkeleton />}
        </div>
      </div>
    </div>
  )
}

/** The sign-in / sign-up card while the page loads: the same rounded card, logo circle and pill button as the real thing. */
export function AuthSkeleton() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 via-pos-canvas to-blue-100 px-4 py-8 dark:from-black dark:via-[#06110a] dark:to-[#0a2415] sm:px-6">
      <div role="status" aria-label="Loading" className="w-full max-w-md rounded-[2rem] bg-white/95 px-6 pb-8 pt-10 shadow-xl ring-1 ring-black/5 dark:bg-neutral-950/85 dark:ring-white/10 sm:px-10 sm:pb-10">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mb-7 flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-11 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-11 w-full" /></div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
