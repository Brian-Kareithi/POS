"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useUIStore } from "@/lib/stores/ui-store"
import { cn } from "@/lib/utils/cn"

const subscribe = () => () => {}

/** Light / dark switch. Safe on server-rendered pages: renders a neutral icon until mounted. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const onClick = () => {
    const root = document.documentElement
    root.classList.add("theme-fade")
    toggleTheme()
    window.setTimeout(() => root.classList.remove("theme-fade"), 250)
  }
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const dark = mounted && theme === "dark"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600",
        className
      )}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
