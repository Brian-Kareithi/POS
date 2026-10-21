"use client"

import Link from "next/link"
import { Clock, Lock } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { can } from "@/lib/permissions"
import { cn } from "@/lib/utils/cn"

/**
 * One-tap shortcut for anyone who works a till: "Open shift" when theirs is closed, "Close shift" while it is open.
 * It takes them to Shifts & Cash with the right dialog already open (the float / the cash count is asked there).
 */
export function ShiftShortcut({ className, compact }: { className?: string; compact?: boolean }) {
  const user = useAuthStore((s) => s.user)
  const open = useDataStore((s) => s.shiftRecords.some((r) => r.userId === user?.id && !r.closedAt))
  const loaded = useDataStore((s) => s.loaded)
  if (!user || !loaded || !can(user.role, "shift.manage")) return null

  const Icon = open ? Lock : Clock
  return (
    <Link
      href={`/employees/shifts?action=${open ? "close" : "open"}`}
      title={open ? "Count the cash and close your shift" : "Start your shift to begin selling"}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
        open ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-green-50 text-green-700 hover:bg-green-100",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      <span className={compact ? "hidden sm:inline" : undefined}>{open ? "Close shift" : "Open shift"}</span>
    </Link>
  )
}
