"use client"

import { cn } from "@/lib/utils/cn"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children && <div className="page-actions flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
