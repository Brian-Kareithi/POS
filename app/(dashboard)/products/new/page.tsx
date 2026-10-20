"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { generateBarcode } from "@/lib/utils/generators"
import { createProduct } from "@/lib/api/products"
import { errorMessage } from "@/lib/api/client"
import { TAX_RATES, UNITS } from "@/lib/constants"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can } from "@/lib/permissions"
import { CategoryDialog } from "@/components/pos/category-dialog"
import { notify } from "@/lib/toast"
import { isBarcodeTaken } from "@/lib/utils/barcode"
import { BarcodeScanner } from "@/components/pos/barcode-scanner"
import { ScanLine, Wand2 } from "lucide-react"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  costPrice: z.coerce.number().min(0, "Must be positive"),
  sellingPrice: z.coerce.number().min(0, "Must be positive"),
  taxRate: z.coerce.number(),
  unit: z.string().min(1, "Unit is required"),
  minStock: z.coerce.number().min(0),
  maxStock: z.coerce.number().min(0),
  description: z.string().optional(),
  barcode: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  stock: z.coerce.number().min(0, "Must be positive"),
})

type ProductForm = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { categories, brands, suppliers, products } = useDataStore()
  const [scanning, setScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newCategory, setNewCategory] = useState(false)
  const canAddCategory = can(useAuthStore((s) => s.user?.role), "products.edit")

  const { register, handleSubmit, formState: { errors }, watch, setValue, setError } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { taxRate: 0, unit: "piece", minStock: 0, maxStock: 100, stock: 0, barcode: "" },
  })

  const name = watch("name")
  const categoryId = watch("categoryId")

  const onSubmit = async (data: ProductForm) => {
    const barcode = data.barcode?.trim() || generateBarcode()
    if (isBarcodeTaken(products, barcode)) {
      setError("barcode", { message: "Another product already uses this barcode" })
      return
    }
    setIsLoading(true)
    try {
      await createProduct({
        name: data.name,
        barcode,
        expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
        batchNumber: data.batchNumber || undefined,
        categoryId: data.categoryId,
        brandId: data.brandId || undefined,
        supplierId: data.supplierId || undefined,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        taxRate: data.taxRate,
        unit: data.unit,
        minStock: data.minStock,
        maxStock: data.maxStock,
        description: data.description || undefined,
        openingStock: data.stock,
      })
    } catch (e) {
      setIsLoading(false)
      return notify.error("Could not add the product", errorMessage(e))
    }
    notify.success("Product added", data.name)
    setIsLoading(false)
    router.push("/products")
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Product" description="Add a new product to your inventory" />
      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Product Details</h3></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Product Name" error={errors.name?.message} {...register("name")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Category" options={[...categories.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name })), ...(canAddCategory ? [{ value: "__new__", label: "+ New category" }] : [])]} placeholder="Select category" error={errors.categoryId?.message} {...register("categoryId", { onChange: (e) => { if (e.target.value === "__new__") { setValue("categoryId", ""); setNewCategory(true) } } })} />
              <Select label="Brand" options={brands.map((b) => ({ value: b.id, label: b.name }))} placeholder="Select brand" {...register("brandId")} />
            </div>
            <Select label="Supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select supplier" {...register("supplierId")} />
            <div>
              <Input label="Barcode" placeholder="Scan, type, or leave blank to generate" error={errors.barcode?.message} {...register("barcode")} />
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setScanning(true)}><ScanLine className="h-3.5 w-3.5" />Scan</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setValue("barcode", generateBarcode())}><Wand2 className="h-3.5 w-3.5" />Generate</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Expiry date (if perishable)" type="date" {...register("expiryDate")} />
              <Input label="Batch number" {...register("batchNumber")} />
            </div>
            <Textarea label="Description" {...register("description")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Cost Price" type="number" step={100} error={errors.costPrice?.message} {...register("costPrice")} />
              <Input label="Selling Price" type="number" step={100} error={errors.sellingPrice?.message} {...register("sellingPrice")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Tax Rate" options={TAX_RATES.map((t) => ({ value: t.value, label: t.label }))} {...register("taxRate", { valueAsNumber: true })} />
              <Select label="Unit" options={UNITS.map((u) => ({ value: u.value, label: u.label }))} {...register("unit")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Opening Stock" type="number" error={errors.stock?.message} {...register("stock", { valueAsNumber: true })} />
              <Input label="Min Stock" type="number" error={errors.minStock?.message} {...register("minStock", { valueAsNumber: true })} />
              <Input label="Max Stock" type="number" error={errors.maxStock?.message} {...register("maxStock", { valueAsNumber: true })} />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" isLoading={isLoading}>Create Product</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <CategoryDialog open={newCategory} onClose={() => setNewCategory(false)} onSaved={(c) => { setValue("categoryId", c.id, { shouldValidate: true }); setNewCategory(false) }} />
      <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onDetected={(code) => setValue("barcode", code)} />
    </div>
  )
}
