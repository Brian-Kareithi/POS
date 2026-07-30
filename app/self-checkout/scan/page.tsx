"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/stores/cart-store"
import { useDataStore } from "@/lib/stores/data-store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Scan, Search, Plus } from "lucide-react"
import Link from "next/link"

export default function ScanPage() {
  const router = useRouter()
  const { products } = useDataStore()
  const addItem = useCartStore((s) => s.addItem)
  const [barcode, setBarcode] = useState("")
  const [search, setSearch] = useState("")

  const handleBarcode = () => {
    const product = products.find((p) => p.barcode === barcode)
    if (product) {
      addItem(product)
      setBarcode("")
    }
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/self-checkout" className="text-sm text-blue-600 hover:text-blue-700">Back</Link>
        <h1 className="text-lg font-semibold text-gray-900">Scan Items</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input placeholder="Scan barcode..." value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleBarcode()} />
              <Button onClick={handleBarcode}><Scan className="h-4 w-4" />Scan</Button>
            </div>
          </CardContent>
        </Card>

        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search className="h-4 w-4" />} />

        <div className="space-y-2">
          {filtered.map((product) => (
            <Card key={product.id} className="hover:border-gray-300">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">${product.sellingPrice.toFixed(2)}</p>
                </div>
                <Button size="sm" onClick={() => addItem(product)}><Plus className="h-3 w-3" />Add</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Link href="/self-checkout/cart">
          <Button className="w-full">View Cart</Button>
        </Link>
      </div>
    </div>
  )
}
