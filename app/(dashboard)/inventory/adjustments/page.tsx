"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { ClipboardList } from "lucide-react"

export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Stock Adjustments" description="Record stock changes" />
      <Card><CardContent>
        <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="No adjustments yet" description="Stock adjustments will appear here when inventory is modified." />
      </CardContent></Card>
    </div>
  )
}
