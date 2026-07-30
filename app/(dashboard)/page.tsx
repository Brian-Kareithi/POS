"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { StatsCard } from "@/components/ui/stats-card"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import {
  DollarSign, TrendingUp, TrendingDown, Package,
  AlertTriangle, ShoppingCart, Users, BarChart3
} from "lucide-react"

export default function DashboardPage() {
  const products = useDataStore((s) => s.products)
  const customers = useDataStore((s) => s.customers)
  const sales = useDataStore((s) => s.sales)

  const stats = useMemo(() => {
    const salesToday = sales.filter((s) => {
      const d = new Date(s.createdAt)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    })
    const salesWeek = sales.filter((s) => {
      const d = new Date(s.createdAt)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    })
    return {
      salesToday: salesToday.length,
      salesTodayRevenue: salesToday.reduce((sum, s) => sum + s.total, 0),
      salesWeek: salesWeek.length,
      salesWeekRevenue: salesWeek.reduce((sum, s) => sum + s.total, 0),
      totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
      inventoryValue: products.reduce((sum, p) => sum + p.costPrice * 100, 0),
      lowStock: products.filter((p) => p.minStock > 50).length,
      totalCustomers: customers.length,
      totalProducts: products.length,
    }
  }, [sales, products, customers])

  const recentSales = useMemo(() => sales.slice(0, 5), [sales])
  const bestSelling = useMemo(() => products.slice(0, 5), [products])

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your business performance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Sales Today" value={formatCurrency(stats.salesTodayRevenue)} change={`${stats.salesToday} orders`} changeType="positive" icon={ShoppingCart} />
        <StatsCard title="This Week" value={formatCurrency(stats.salesWeekRevenue)} change={`${stats.salesWeek} orders`} changeType="positive" icon={TrendingUp} />
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} change="All time" icon={DollarSign} />
        <StatsCard title="Inventory Value" value={formatCurrency(stats.inventoryValue)} change={`${stats.lowStock} low stock alerts`} changeType={stats.lowStock > 0 ? "negative" : "positive"} icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
            <Link href="/sales" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">No sales yet</TableCell>
                  </TableRow>
                ) : recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.orderNumber}</TableCell>
                    <TableCell>{formatCurrency(sale.total)}</TableCell>
                    <TableCell>
                      <Badge variant={sale.status === "completed" ? "success" : sale.status === "refunded" ? "danger" : "default"}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDateTime(sale.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Best Selling Products</h3>
            <Link href="/products" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestSelling.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-gray-500">{product.sku}</TableCell>
                    <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={product.minStock > 50 ? "warning" : "success"}>
                        {product.minStock > 50 ? "Low" : "In Stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatsCard title="Total Products" value={stats.totalProducts.toString()} icon={Package} />
        <StatsCard title="Total Customers" value={stats.totalCustomers.toString()} icon={Users} />
        <StatsCard title="Low Stock Alerts" value={stats.lowStock.toString()} changeType={stats.lowStock > 0 ? "negative" : "positive"} icon={AlertTriangle} />
      </div>
    </div>
  )
}
