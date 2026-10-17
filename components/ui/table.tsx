"use client"

import { useLayoutEffect, useRef } from "react"
import { cn } from "@/lib/utils/cn"

interface TableProps {
  /** Keep a horizontally scrolling table on phones instead of stacking rows into cards (e.g. matrices). */
  scroll?: boolean
  children?: React.ReactNode
  className?: string
}

/**
 * On md+ screens this is a normal table. Below md, CSS (.rt in globals.css) turns each row into a
 * stacked card; the effect below copies each header label onto its cells so they can be shown.
 */
export function Table({ children, className, scroll }: TableProps) {
  const ref = useRef<HTMLTableElement>(null)

  useLayoutEffect(() => {
    const table = ref.current
    if (!table) return
    if (scroll) return
    const labels = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "")
    table.querySelectorAll("tbody tr").forEach((row) => {
      const cells = Array.from(row.children)
      let col = 0
      let extras = 0
      cells.forEach((cell, i) => {
        const span = Number(cell.getAttribute("colspan") ?? 1)
        const label = span > 1 ? "" : labels[col] ?? ""
        if (cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label)
        // Phone cards show the title, the next two fields and any action cell; the rest expand on tap.
        const extra = span === 1 && i > 2 && !(label === "" && i === cells.length - 1)
        if (extra) extras++
        if (extra !== cell.hasAttribute("data-extra")) cell.toggleAttribute("data-extra", extra)
        col += span
      })
      if ((extras > 0) !== row.hasAttribute("data-expandable")) {
        row.toggleAttribute("data-expandable", extras > 0)
        if (extras > 0) row.setAttribute("tabindex", "0")
        else row.removeAttribute("tabindex")
      }
    })
  })

  const toggleRow = (target: EventTarget | null) => {
    const row = (target as HTMLElement | null)?.closest("tbody tr")
    if (row?.hasAttribute("data-expandable")) row.toggleAttribute("data-open")
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table
        ref={ref}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest("a, button, input, select, textarea, label")) toggleRow(e.target)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target === (e.target as HTMLElement).closest("tr")) toggleRow(e.target)
        }}
        className={cn(!scroll && "rt", "min-w-full divide-y divide-gray-200", className)}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <thead className={cn("bg-gray-50", className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableProps) {
  return (
    <tbody className={cn("divide-y divide-gray-100 bg-white", className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr className={cn("hover:bg-gray-50 transition-colors", className)}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th className={cn("px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500", className)}>
      {children}
    </th>
  )
}

export function TableCell({ children, className, colSpan }: TableProps & { colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("px-6 py-4 text-sm text-gray-900 whitespace-nowrap", className)}>
      {children}
    </td>
  )
}
