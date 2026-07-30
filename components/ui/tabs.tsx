"use client"

import { cn } from "@/lib/utils/cn"
import { useState } from "react"

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[]
  activeTab?: string
  onTabChange: (tab: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id)
  const current = activeTab ?? internalTab

  return (
    <div className={cn("border-b border-gray-200", className)}>
      <nav className="flex gap-0 -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setInternalTab(tab.id)
              onTabChange(tab.id)
            }}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              current === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
