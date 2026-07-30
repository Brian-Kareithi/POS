"use client"

import { cn } from "@/lib/utils/cn"
import { Card, CardContent } from "./card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: LucideIcon
  className?: string
}

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon, className }: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p
                className={cn("text-sm", {
                  "text-green-600": changeType === "positive",
                  "text-red-600": changeType === "negative",
                  "text-gray-500": changeType === "neutral",
                })}
              >
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="rounded-lg bg-gray-50 p-3">
              <Icon className="h-6 w-6 text-gray-600" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
