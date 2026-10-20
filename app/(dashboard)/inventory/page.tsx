"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { can } from "@/lib/permissions"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency } from "@/lib/utils/format"
import { getStock, getBranchStock, expiryStatus, daysToExpiry } from "@/lib/utils/stock"
import { exportCSV } from "@/lib/utils/export"
import { Package, Warehouse, AlertTriangle, ArrowRightLeft, PackagePlus, ScanLine, Download, CalendarClock } from "lucide-react"
import { StockDialog } from "@/components/pos/stock-dialog"
import { ProductFormDialog } from "@/components/pos/product-form-dialog"
import { BarcodeScanner } from "@/components/pos/barcode-scanner"
import { useScannerInput } from "@/lib/hooks/use-scanner-input"
import { findProductByCode } from "@/lib/utils/barcode"
import type { Product } from "@/lib/types"

export default function InventoryPage() {
  const { products: allProducts, branches } = useDataStore()
  const role = useAuthStore((s) => s.user?.role)
  const { branchId } = useBranchFilter()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)

  const products = useMemo(() => allProducts.filter((p) => p.isActive), [allProducts])
  const ids = branches.map((b) => b.id)
  const showSplit = branchId === "all" && branches.length > 1
  const unitsHere = (p: Product) => (branchId === "all" ? getStock(p) : getBranchStock(p, branchId, ids))

  // Scanning a barcode on this page jumps straight to that product's stock update.
  const openByCode = (code: string) => {
    const product = findProductByCode(allProducts, code)
    if (product && can(role, "stock.edit")) setEditing(product)
    else setSearch(code)
  }
  useScannerInput(openByCode, !editing && !addOpen && !scanOpen)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(search))
  }, [products, search])

  const totalUnits = products.reduce((sum, p) => sum + unitsHere(p), 0)
  const lowStock = products.filter((p) => unitsHere(p) <= p.minStock / (branchId === "all" ? 1 : 2)).length
  const totalValue = products.reduce((s, p) => s + p.costPrice * unitsHere(p), 0)
  const expiring = products.filter((p) => ["soon", "expired"].includes(expiryStatus(p))).length

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock levels by branch, expiry dates and movements">
        {can(role, "products.edit") && <Button onClick={() => setAddOpen(true)}><PackagePlus className="h-4 w-4" />Add Product</Button>}
        <Button variant="secondary" onClick={() => setScanOpen(true)}><ScanLine className="h-4 w-4" />Scan</Button>
        {can(role, "reports.export") && (
          <Button variant="secondary" onClick={() => exportCSV(filtered.map((p) => ({ Product: p.name, SKU: p.sku, Barcode: p.barcode, ...Object.fromEntries(branches.map((b) => [b.name, getBranchStock(p, b.id, ids)])), Total: getStock(p), "Stock value": getStock(p) * p.costPrice, Expiry: p.expiryDate?.slice(0, 10) ?? "" })), "inventory")}><Download className="h-4 w-4" />Export</Button>
        )}
        <Link href="/inventory/transfers"><Button variant="secondary"><ArrowRightLeft className="h-4 w-4" />Transfers</Button></Link>
        <Link href="/inventory/purchase-orders"><Button variant="secondary">Purchase Orders</Button></Link>
        <Link href="/inventory/adjustments"><Button variant="secondary">Adjustments</Button></Link>
        <Link href="/inventory/warehouses"><Button variant="secondary"><Warehouse className="h-4 w-4" />Warehouses</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Units in stock" value={totalUnits.toLocaleString()} icon={Package} />
        <StatsCard title="Stock value (at cost)" value={formatCurrency(totalValue)} icon={Warehouse} />
        <StatsCard title="Low stock items" value={lowStock.toString()} changeType={lowStock > 0 ? "negative" : "positive"} icon={AlertTriangle} />
        <StatsCard title="Expiring within 30 days" value={expiring.toString()} changeType={expiring > 0 ? "negative" : "positive"} icon={CalendarClock} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search by name, SKU or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Barcode</TableHead>
              {showSplit ? branches.map((b) => <TableHead key={b.id}>{b.name.replace(" Store", "").replace(" Branch", "")}</TableHead>) : <TableHead>In stock</TableHead>}
              {showSplit && <TableHead>Total</TableHead>}
              <TableHead>Value</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              {can(role, "stock.edit") && <TableHead></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => {
              const units = unitsHere(product)
              const low = units <= product.minStock / (branchId === "all" ? 1 : 2)
              const expiry = expiryStatus(product)
              const days = daysToExpiry(product)
              return (
                <TableRow key={product.id}>
                  <TableCell><span className="font-medium">{product.name}</span><span className="block font-mono text-xs text-gray-400">{product.sku}</span></TableCell>
                  <TableCell className="text-gray-500 font-mono text-xs">{product.barcode}</TableCell>
                  {showSplit ? branches.map((b) => <TableCell key={b.id}>{getBranchStock(product, b.id, ids)}</TableCell>) : <TableCell>{units}</TableCell>}
                  {showSplit && <TableCell className="font-medium">{getStock(product)}</TableCell>}
                  <TableCell>{formatCurrency(product.costPrice * units)}</TableCell>
                  <TableCell>
                    {expiry === "none" ? <span className="text-gray-400">-</span> : (
                      <span><Badge variant={expiry === "expired" ? "danger" : expiry === "soon" ? "warning" : "default"}>{expiry === "expired" ? "Expired" : `${days} days`}</Badge>{product.batchNumber && <span className="mt-0.5 block font-mono text-xs text-gray-400">{product.batchNumber}</span>}</span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant={units === 0 ? "danger" : low ? "warning" : "success"}>{units === 0 ? "Out of stock" : low ? "Low stock" : "In stock"}</Badge></TableCell>
                  {can(role, "stock.edit") && <TableCell><Button size="sm" variant="secondary" onClick={() => setEditing(product)}>Update stock</Button></TableCell>}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <StockDialog product={editing} onClose={() => setEditing(null)} />
      <ProductFormDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <BarcodeScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={openByCode} />
    </div>
  )
}
