"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { CategoryDialog } from "@/components/pos/category-dialog"
import { isBarcodeTaken } from "@/lib/utils/barcode"
import { notify } from "@/lib/toast"
import { generateBarcode } from "@/lib/utils/generators"
import { createProduct } from "@/lib/api/products"
import { errorMessage } from "@/lib/api/client"
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
  const [saving, setSaving] = useState(false)
  const [newCategory, setNewCategory] = useState(false)
  const canAddCategory = can(useAuthStore((s) => s.user?.role), "products.edit")
  const [form, setForm] = useState({ ...empty, barcode: initialBarcode ?? "" })
  const [error, setError] = useState("")
  const [scanning, setScanning] = useState(false)

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
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

    setSaving(true)
    try {
      const product = await createProduct({
        name: form.name.trim(), categoryId: form.categoryId, barcode,
        costPrice: Number.isNaN(cost) ? 0 : cost, sellingPrice: price, taxRate: parseFloat(form.taxRate) || 0, unit: "piece",
        minStock: parseInt(form.minStock || "0", 10) || 0, maxStock: Math.max(100, stock * 2), openingStock: stock,
      })
      notify.success("Product added", `${product.name} · barcode ${product.barcode}`)
      onCreated?.(product)
      onClose()
    } catch (err) {
      setError(errorMessage(err, "Could not save the product."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title="Add product" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Product name" value={form.name} onChange={set("name")} autoFocus />
        <Select label="Category" placeholder="Select category" options={[...categories.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name })), ...(canAddCategory ? [{ value: "__new__", label: "+ New category" }] : [])]} value={form.categoryId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { if (e.target.value === "__new__") setNewCategory(true); else setForm((f) => ({ ...f, categoryId: e.target.value })) }} />
        <div>
          <Input label="Barcode" value={form.barcode} onChange={set("barcode")} placeholder="Scan, type, or generate" />
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setScanning(true)}><ScanLine className="h-3.5 w-3.5" />Scan</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, barcode: generateBarcode() }))}><Wand2 className="h-3.5 w-3.5" />Generate</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Cost price" type="number" step={100} min="0" value={form.costPrice} onChange={set("costPrice")} />
          <Input label="Selling price" type="number" step={100} min="0" value={form.sellingPrice} onChange={set("sellingPrice")} />
          <Input label="Opening stock" type="number" min="0" value={form.stock} onChange={set("stock")} />
          <Input label="Low-stock level" type="number" min="0" value={form.minStock} onChange={set("minStock")} />
          <Input label="Tax rate (%)" type="number" min="0" step={1} value={form.taxRate} onChange={set("taxRate")} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={saving}>Save product</Button>
        </div>
      </form>
      <CategoryDialog open={newCategory} onClose={() => setNewCategory(false)} onSaved={(c) => { setForm((f) => ({ ...f, categoryId: c.id })); setNewCategory(false) }} />
      <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onDetected={(code) => setForm((f) => ({ ...f, barcode: code }))} />
    </Dialog>
  )
}
