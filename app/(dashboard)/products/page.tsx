"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils/format"
import { getStock, expiryStatus, daysToExpiry } from "@/lib/utils/stock"
import { updateProduct } from "@/lib/api/products"
import { errorMessage } from "@/lib/api/client"
import { exportCSV } from "@/lib/utils/export"
import { Plus, Package, MoreHorizontal, Edit, Archive, ArchiveRestore, Download } from "lucide-react"

export default function ProductsPage() {
  const { products, categories } = useDataStore()
  const role = useAuthStore((s) => s.user?.role)
  const canEdit = can(role, "products.edit")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [showActions, setShowActions] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(search)
      const matchesCategory = !categoryFilter || p.categoryId === categoryFilter
      return matchesSearch && matchesCategory && (showArchived || p.isActive)
    })
  }, [products, search, categoryFilter, showArchived])

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || "N/A"
  const archivedCount = products.filter((p) => !p.isActive).length

  const toggleArchive = async (id: string) => {
    const product = products.find((p) => p.id === id)
    if (!product) return
    try {
      await updateProduct(id, { isActive: !product.isActive })
    } catch (e) {
      return notify.error("Could not update the product", errorMessage(e))
    }
    notify.success(product.isActive ? "Product archived" : "Product restored", product.name)
    setShowActions(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description={`${products.filter((p) => p.isActive).length} active products${archivedCount ? ` · ${archivedCount} archived` : ""}`}>
        {canEdit && (
          <Link href="/products/new">
            <Button><Plus className="h-4 w-4" />Add Product</Button>
          </Link>
        )}
        {can(role, "reports.export") && (
          <Button variant="secondary" onClick={() => exportCSV(filtered.map((p) => ({ Name: p.name, SKU: p.sku, Barcode: p.barcode, Category: getCategoryName(p.categoryId), Cost: p.costPrice, Price: p.sellingPrice, "Tax %": p.taxRate, Stock: getStock(p), Expiry: p.expiryDate?.slice(0, 10) ?? "", Batch: p.batchNumber ?? "", Active: p.isActive ? "yes" : "no" })), "products")}><Download className="h-4 w-4" />Export</Button>
        )}
        <Link href="/products/categories"><Button variant="secondary">Categories</Button></Link>
        <Link href="/products/brands"><Button variant="secondary">Brands</Button></Link>
        <Link href="/products/suppliers"><Button variant="secondary">Suppliers</Button></Link>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <SearchInput placeholder="Search by name, SKU or barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />Show archived</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={<Package className="h-12 w-12" />} title="No products found" description="Try adjusting your search or filters" action={canEdit ? <Link href="/products/new"><Button><Plus className="h-4 w-4" />Add Product</Button></Link> : undefined} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => {
                  const stock = getStock(product)
                  const expiry = expiryStatus(product)
                  const days = daysToExpiry(product)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link href={`/products/${product.id}`} className="font-medium text-blue-600 hover:text-blue-700">{product.name}</Link>
                        <span className="block font-mono text-xs text-gray-400">{product.sku}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 font-mono text-xs">{product.barcode}</TableCell>
                      <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                      <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                      <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                      <TableCell><Badge variant={stock === 0 ? "danger" : stock <= product.minStock ? "warning" : "success"}>{stock}</Badge></TableCell>
                      <TableCell>
                        {expiry === "none" ? <span className="text-gray-400">-</span> : (
                          <Badge variant={expiry === "expired" ? "danger" : expiry === "soon" ? "warning" : "default"}>{expiry === "expired" ? "Expired" : `${days} days`}</Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={product.isActive ? "success" : "default"}>{product.isActive ? "Active" : "Archived"}</Badge></TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="relative">
                            <button aria-label="Actions" onClick={() => setShowActions(showActions === product.id ? null : product.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {showActions === product.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowActions(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                                  <Link href={`/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowActions(null)}>
                                    <Edit className="h-4 w-4" /> Edit
                                  </Link>
                                  <button onClick={() => toggleArchive(product.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                                    {product.isActive ? <><Archive className="h-4 w-4" /> Archive</> : <><ArchiveRestore className="h-4 w-4" /> Restore</>}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
