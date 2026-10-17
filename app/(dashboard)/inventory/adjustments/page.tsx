"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/stores/data-store"
import { formatDateTime } from "@/lib/utils/format"
import { ClipboardList } from "lucide-react"

export default function AdjustmentsPage() {
  const adjustments = useDataStore((s) => s.stockAdjustments)

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Adjustments" description="Every manual stock change is logged here" />
      <Card><CardContent className={adjustments.length ? "p-0" : undefined}>
        {adjustments.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="No adjustments yet" description="Update stock from the Inventory page and it will be logged here." />
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Change</TableHead><TableHead>Reason</TableHead><TableHead>By</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {adjustments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.productName}</TableCell>
                  <TableCell className="text-gray-500">{a.sku}</TableCell>
                  <TableCell><Badge variant={a.change >= 0 ? "success" : "danger"}>{a.change > 0 ? `+${a.change}` : a.change}</Badge></TableCell>
                  <TableCell>{a.reason}</TableCell>
                  <TableCell>{a.userName}</TableCell>
                  <TableCell className="text-gray-500">{formatDateTime(a.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  )
}
