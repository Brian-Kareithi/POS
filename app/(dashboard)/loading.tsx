"use client"

import { usePathname } from "next/navigation"
import { DashboardSkeleton, PosSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return usePathname() === "/" ? <PosSkeleton /> : <DashboardSkeleton />
}
