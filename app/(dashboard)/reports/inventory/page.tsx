"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/format"
import { Package, AlertTriangle, DollarSign, Download } from "lucide-react"

export default function InventoryReportsPage() {
  const products = useDataStore((s) => s.products)
  const totalValue = products.reduce((s, p) => s + p.costPrice * 100, 0)
  const lowStock = products.filter((p) => p.minStock > 50).length

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Reports" description="Stock level analysis">
        <Button variant="secondary"><Download className="h-4 w-4" />Export</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Products" value={products.length.toString()} icon={Package} />
        <StatsCard title="Inventory Value" value={formatCurrency(totalValue)} icon={DollarSign} />
        <StatsCard title="Low Stock Items" value={lowStock.toString()} changeType={lowStock > 0 ? "negative" : "positive"} icon={AlertTriangle} />
      </div>
      <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900">Stock Levels</h3></CardHeader>
        <CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Stock</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-gray-500 font-mono text-xs">{p.sku}</TableCell>
              <TableCell>100</TableCell>
              <TableCell>{formatCurrency(p.costPrice * 100)}</TableCell>
              <TableCell><Badge variant={100 <= p.minStock ? "warning" : "success"}>{100 <= p.minStock ? "Low" : "In Stock"}</Badge></TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </CardContent></Card>
    </div>
  )
}
