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
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/utils/format"
import { Plus, Package, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"

export default function ProductsPage() {
  const { products, categories, removeProduct } = useDataStore()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || p.categoryId === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [products, search, categoryFilter])

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || "N/A"

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description={`${products.length} total products`}>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
        <Link href="/products/categories">
          <Button variant="secondary">Categories</Button>
        </Link>
        <Link href="/products/brands">
          <Button variant="secondary">Brands</Button>
        </Link>
        <Link href="/products/suppliers">
          <Button variant="secondary">Suppliers</Button>
        </Link>
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={<Package className="h-12 w-12" />} title="No products found" description="Try adjusting your search or filters" action={<Link href="/products/new"><Button><Plus className="h-4 w-4" />Add Product</Button></Link>} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link href={`/products/${product.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                    <TableCell><Badge variant={product.isActive ? "success" : "default"}>{product.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="relative">
                        <button onClick={() => setShowActions(showActions === product.id ? null : product.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {showActions === product.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowActions(null)} />
                            <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                              <Link href={`/products/${product.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowActions(null)}>
                                <Edit className="h-4 w-4" /> Edit
                              </Link>
                              <button onClick={() => { setShowActions(null); setShowDelete(product.id) }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (showDelete) removeProduct(showDelete); setShowDelete(null) }}>Delete</Button>
        </div>
      </Dialog>
    </div>
  )
}
