"use client"

import { useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Download } from "lucide-react"

export default function SalesReportsPage() {
  const sales = useDataStore((s) => s.sales)
  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Reports" description="Sales performance analysis">
        <Button variant="secondary"><Download className="h-4 w-4" />Export</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Sales" value={sales.length.toString()} icon={ShoppingCart} />
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <StatsCard title="Average Sale" value={formatCurrency(avgSale)} icon={TrendingUp} />
      </div>
      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Amount</TableHead><TableHead>Payment</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>{sales.slice(0, 10).map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.orderNumber}</TableCell>
                <TableCell>{formatCurrency(sale.total)}</TableCell>
                <TableCell className="capitalize">{sale.paymentMethod.replace("_", " ")}</TableCell>
                <TableCell className="text-gray-500">{formatDateTime(sale.createdAt)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
