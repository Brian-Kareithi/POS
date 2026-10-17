"use client"

import { cn } from "@/lib/utils/cn"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-gray-200/70 dark:bg-white/10", className)}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
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
      className={cn("divide-y divide-gray-100 bg-white", bordered && "rounded-xl border border-gray-200")}
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

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <Skeleton className="h-4" style={{ width }} />
}

function SkeletonPanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
      <div>
        <Skeleton className="h-8 w-40 sm:w-48" />
        <Skeleton className="mt-2 h-4 w-56 max-w-full sm:w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    </div>
  )
}

/** Full app-shell placeholder (sidebar, navbar) shown while the session loads. */
export function ShellSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden bg-[#edf2f0] p-2 dark:bg-black lg:gap-3 lg:p-3">
      <div className="hidden w-60 shrink-0 flex-col gap-4 rounded-xl bg-white p-6 shadow-sm lg:flex">
        <Skeleton className="h-8 w-32" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3">
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 rounded-xl bg-white px-3 shadow-sm sm:px-4 lg:px-5">
          <Skeleton className="h-8 w-8 lg:hidden" />
          <Skeleton className="hidden h-9 w-56 md:block lg:w-80" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-9 sm:w-24" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl p-2 sm:p-4 lg:p-6">
          <DashboardSkeleton />
        </div>
      </div>
    </div>
  )
}
