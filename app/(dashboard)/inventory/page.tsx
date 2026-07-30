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
import { formatCurrency } from "@/lib/utils/format"
import { Package, Warehouse, AlertTriangle, ArrowRightLeft } from "lucide-react"

export default function InventoryPage() {
  const { products, warehouses } = useDataStore()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  ), [products, search])

  const totalStock = products.length * 100
  const lowStock = products.filter((p) => p.minStock > 50).length
  const totalValue = products.reduce((s, p) => s + p.costPrice * 100, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Manage your stock levels">
        <Link href="/inventory/warehouses"><Button variant="secondary"><Warehouse className="h-4 w-4" />Warehouses</Button></Link>
        <Link href="/inventory/transfers"><Button variant="secondary"><ArrowRightLeft className="h-4 w-4" />Transfers</Button></Link>
        <Link href="/inventory/purchase-orders"><Button variant="secondary">Purchase Orders</Button></Link>
        <Link href="/inventory/adjustments"><Button variant="secondary">Adjustments</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Items" value={totalStock.toString()} icon={Package} />
        <StatsCard title="Inventory Value" value={formatCurrency(totalValue)} icon={Warehouse} />
        <StatsCard title="Low Stock Items" value={lowStock.toString()} changeType={lowStock > 0 ? "negative" : "positive"} icon={AlertTriangle} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Warehouse</TableHead><TableHead>Stock</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-gray-500 font-mono text-xs">{product.sku}</TableCell>
                <TableCell>{warehouses[0]?.name || "Main Warehouse"}</TableCell>
                <TableCell>{100}</TableCell>
                <TableCell>{formatCurrency(product.costPrice * 100)}</TableCell>
                <TableCell>
                  <Badge variant={100 <= product.minStock ? "warning" : "success"}>
                    {100 <= product.minStock ? "Low Stock" : "In Stock"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
