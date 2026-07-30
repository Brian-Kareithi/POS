"use client"

import { cn } from "@/lib/utils/cn"

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info"
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-orange-50 text-orange-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
