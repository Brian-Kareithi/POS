"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { isBarcodeTaken } from "@/lib/utils/barcode"
import { notify } from "@/lib/toast"
import { generateBarcode, generateId, generateSKU } from "@/lib/utils/generators"
import { BarcodeScanner } from "@/components/pos/barcode-scanner"
import type { Product } from "@/lib/types"
import { ScanLine, Wand2 } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
  initialBarcode?: string
  onCreated?: (product: Product) => void
}

const empty = { name: "", categoryId: "", barcode: "", costPrice: "", sellingPrice: "", stock: "", minStock: "5", taxRate: "0" }

export function ProductFormDialog({ open, onClose, initialBarcode = "", onCreated }: Props) {
  // Remount the form each time it opens so it starts clean (and picks up a scanned barcode).
  return open ? <ProductForm initialBarcode={initialBarcode} onClose={onClose} onCreated={onCreated} /> : null
}

function ProductForm({ onClose, initialBarcode, onCreated }: Omit<Props, "open">) {
  const categories = useDataStore((s) => s.categories)
  const products = useDataStore((s) => s.products)
  const business = useDataStore((s) => s.business)
  const addProduct = useDataStore((s) => s.addProduct)
  const adjustStock = useDataStore((s) => s.adjustStock)
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({ ...empty, barcode: initialBarcode ?? "" })
  const [error, setError] = useState("")
  const [scanning, setScanning] = useState(false)

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(form.sellingPrice)
    const cost = parseFloat(form.costPrice || "0")
    const stock = parseInt(form.stock || "0", 10)
    const barcode = form.barcode.trim() || generateBarcode()
    if (!form.name.trim()) return setError("Enter a product name.")
    if (!form.categoryId) return setError("Choose a category.")
    if (Number.isNaN(price) || price < 0) return setError("Enter a selling price.")
    if (Number.isNaN(stock) || stock < 0) return setError("Stock can't be negative.")
    if (isBarcodeTaken(products, barcode)) return setError("Another product already uses this barcode.")

    const now = new Date().toISOString()
    const product: Product = {
      id: generateId(),
      businessId: business?.id ?? "",
      categoryId: form.categoryId,
      name: form.name.trim(),
      slug: form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: generateSKU(form.name, categories.find((c) => c.id === form.categoryId)?.name ?? ""),
      barcode,
      costPrice: Number.isNaN(cost) ? 0 : cost,
      sellingPrice: price,
      taxRate: parseFloat(form.taxRate) || 0,
      unit: "piece",
      minStock: parseInt(form.minStock || "0", 10) || 0,
      maxStock: Math.max(100, stock * 2),
      isActive: true,
      hasVariants: false,
      stock: 0,
      createdAt: now,
      updatedAt: now,
    }
    addProduct(product)
    if (stock > 0) adjustStock(product.id, stock, "Opening stock", user?.name)
    notify.success("Product added", `${product.name} · barcode ${product.barcode}`)
    onCreated?.({ ...product, stock })
    onClose()
  }

  return (
    <Dialog open onClose={onClose} title="Add product" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Product name" value={form.name} onChange={set("name")} autoFocus />
        <Select label="Category" placeholder="Select category" options={categories.map((c) => ({ value: c.id, label: c.name }))} value={form.categoryId} onChange={set("categoryId")} />
        <div>
          <Input label="Barcode" value={form.barcode} onChange={set("barcode")} placeholder="Scan, type, or generate" />
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setScanning(true)}><ScanLine className="h-3.5 w-3.5" />Scan</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, barcode: generateBarcode() }))}><Wand2 className="h-3.5 w-3.5" />Generate</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cost price" type="number" step="0.01" min="0" value={form.costPrice} onChange={set("costPrice")} />
          <Input label="Selling price" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={set("sellingPrice")} />
          <Input label="Opening stock" type="number" min="0" value={form.stock} onChange={set("stock")} />
          <Input label="Low-stock level" type="number" min="0" value={form.minStock} onChange={set("minStock")} />
          <Input label="Tax rate (%)" type="number" min="0" step="0.1" value={form.taxRate} onChange={set("taxRate")} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save product</Button>
        </div>
      </form>
      <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onDetected={(code) => setForm((f) => ({ ...f, barcode: code }))} />
    </Dialog>
  )
}
