"use client"

import { useEffect } from "react"

type ShortcutHandler = (e: KeyboardEvent) => void

const shortcuts = new Map<string, ShortcutHandler>()

export function useKeyboardShortcut(
  key: string,
  handler: ShortcutHandler,
  options?: { ctrl?: boolean; alt?: boolean; shift?: boolean }
) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const ctrl = options?.ctrl ?? false
      const alt = options?.alt ?? false
      const shift = options?.shift ?? false

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        e.ctrlKey === ctrl &&
        e.altKey === alt &&
        e.shiftKey === shift
      ) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [key, handler, options])
}
