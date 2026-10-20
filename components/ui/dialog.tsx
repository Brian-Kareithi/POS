"use client"

import { useEffect, useId, useRef } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils/cn"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

/** Open dialogs, oldest first. Only the last one reacts to Escape and Tab, so a dialog opened from another leaves the first alone. */
const openStack: string[] = []
const isTop = (id: string) => openStack[openStack.length - 1] === id

export function Dialog({ open, onClose, title, children, className, size = "md" }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Move focus into the dialog when it opens, keep Tab inside it, and give focus back to what opened it on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    openStack.push(titleId)
    const panel = panelRef.current
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    if (panel && !panel.contains(document.activeElement)) (focusable().find((el) => el.tagName !== "BUTTON" || el.getAttribute("aria-label") !== "Close") ?? panel).focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !isTop(titleId)) return
      const items = focusable()
      if (items.length === 0) return e.preventDefault()
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", trap)
    return () => {
      document.removeEventListener("keydown", trap)
      const at = openStack.indexOf(titleId)
      if (at >= 0) openStack.splice(at, 1)
      opener?.focus?.()
    }
  }, [open, titleId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTop(titleId)) onClose()
    }
    if (open) {
      document.addEventListener("keydown", handler)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [open, onClose, titleId])

  if (!open) return null

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  // Rendered on <body>: inside the page, an animated ancestor would trap "fixed" and the backdrop would not cover the whole screen.
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] anim-overlay sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn("anim-pop flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/5 outline-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl", sizes[size], className)}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="-mr-2 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 pb-6", title ? "pt-1" : "pt-6")}>{children}</div>
      </div>
    </div>,
    document.body
  )
}
