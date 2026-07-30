"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { ShoppingCart, DollarSign, RefreshCw, FileText } from "lucide-react"

export default function SalesPage() {
  const sales = useDataStore((s) => s.sales)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => sales.filter((s) =>
    s.orderNumber.toLowerCase().includes(search.toLowerCase())
  ), [sales, search])

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)
  const completedSales = sales.filter((s) => s.status === "completed").length

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description={`${sales.length} total transactions`}>
        <Link href="/sales/new"><Button><ShoppingCart className="h-4 w-4" />New Sale</Button></Link>
        <Link href="/sales/returns"><Button variant="secondary"><RefreshCw className="h-4 w-4" />Returns</Button></Link>
        <Link href="/sales/quotes"><Button variant="secondary"><FileText className="h-4 w-4" />Quotes</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <StatsCard title="Completed Sales" value={completedSales.toString()} icon={ShoppingCart} />
        <StatsCard title="Average Sale" value={sales.length > 0 ? formatCurrency(totalRevenue / sales.length) : "$0.00"} icon={ShoppingCart} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search by order number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No sales yet. Start by creating a new sale.</TableCell></TableRow>
            ) : filtered.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium"><Link href={`/sales/${sale.id}`} className="text-blue-600 hover:text-blue-700">{sale.orderNumber}</Link></TableCell>
                <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                <TableCell>{sale.items?.length || 0}</TableCell>
                <TableCell>{formatCurrency(sale.total)}</TableCell>
                <TableCell className="capitalize">{sale.paymentMethod.replace("_", " ")}</TableCell>
                <TableCell><Badge variant={sale.status === "completed" ? "success" : sale.status === "refunded" ? "danger" : "default"}>{sale.status}</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(sale.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
