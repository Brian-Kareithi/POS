"use client"

import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/stores/ui-store"

/** The shapes below follow the live design: rounded cards (rounded-2xl), pill buttons, a floating sidebar and top bar. */

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
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/** Stat cards in a 2x2 block (two across on every screen, four across on very wide ones). */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 sm:p-5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl sm:h-11 sm:w-11" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-12 sm:w-16" />
            <Skeleton className="h-3 w-full max-w-24" />
          </div>
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
      className={cn("divide-y divide-gray-100 bg-white", bordered && "overflow-hidden rounded-2xl border border-gray-200")}
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
    <div role="status" aria-label="Loading" className={cn("divide-y divide-gray-100 bg-white", bordered && "overflow-hidden rounded-2xl border border-gray-200", className)}>
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
    <div role="status" aria-label="Loading" className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  )
}

export function PageHeaderSkeleton({ action }: { action?: boolean }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Skeleton className="h-7 w-40 sm:h-8 sm:w-48" />
        <Skeleton className="mt-2 h-4 w-56 max-w-full sm:w-72" />
      </div>
      {action && <Skeleton className="h-9 w-28 shrink-0 rounded-full" />}
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
      <Skeleton className="h-8 w-32 rounded-full" />
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5">
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

function SkeletonPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
        <Skeleton className="h-5 w-32" />
      </div>
      <SkeletonTable rows={3} cols={4} bordered={false} />
    </div>
  )
}

/** Page-content placeholder: heading, stat cards, two panels. Mirrors the real dashboard pages. */
export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4 sm:space-y-6">
      <PageHeaderSkeleton action />
      <StatGridSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    </div>
  )
}

/**
 * Full app-shell placeholder shown while the session loads, drawn like the real shell: a solid floating sidebar
 * (logo and name, menu pills, then the profile chip above Logout), a floating top bar (menu button, search, shift pill, theme, bell),
 * and a page. It follows the saved collapsed/expanded sidebar, and on a phone shows the hamburger and logo instead of the sidebar.
 */
export function ShellSkeleton() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
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
        <div className="flex h-14 shrink-0 items-center gap-3 rounded-2xl bg-white px-3 shadow-sm ring-1 ring-black/5 sm:px-4 lg:px-5 lg:ring-0">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl lg:hidden" />
          <Skeleton className="hidden h-9 w-56 rounded-full md:block lg:w-80" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full sm:w-28" />
            <Skeleton className="hidden h-9 w-24 rounded-full sm:block" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl p-2 sm:p-4 lg:p-6">
          <DashboardSkeleton />
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
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
