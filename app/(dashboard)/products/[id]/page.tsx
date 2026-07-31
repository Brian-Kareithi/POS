"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Badge } from "@/components/ui/badge"
import { Tabs } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils/format"
import { TAX_RATES, UNITS } from "@/lib/constants"

const productSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number(),
  unit: z.string().min(1),
  minStock: z.coerce.number().min(0),
  maxStock: z.coerce.number().min(0),
  description: z.string().optional(),
})

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { products, categories, brands, suppliers, updateProduct } = useDataStore()
  const [activeTab, setActiveTab] = useState("details")
  const [isLoading, setIsLoading] = useState(false)

  const product = products.find((p) => p.id === params.id)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      categoryId: product?.categoryId || "",
      brandId: product?.brandId || "",
      supplierId: product?.supplierId || "",
      costPrice: product?.costPrice || 0,
      sellingPrice: product?.sellingPrice || 0,
      taxRate: product?.taxRate || 0,
      unit: product?.unit || "",
      minStock: product?.minStock || 0,
      maxStock: product?.maxStock || 0,
      description: product?.description || "",
    },
  })

  if (!product) {
    return <div className="text-center py-16 text-gray-500">Product not found</div>
  }

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    updateProduct(product.id, data)
    setIsLoading(false)
    router.push("/products")
  }

  const getCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name || "N/A"
  const getBrandName = (id?: string) => brands.find((b) => b.id === id)?.name || "N/A"
  const getSupplierName = (id?: string) => suppliers.find((s) => s.id === id)?.name || "N/A"

  return (
    <div className="max-w-3xl">
      <PageHeader title={product.name} description={`SKU: ${product.sku} | Barcode: ${product.barcode}`}>
        <Button variant="secondary" onClick={() => router.push("/products")}>Back</Button>
      </PageHeader>

      <Tabs tabs={[{ id: "details", label: "Details" }, { id: "history", label: "History" }]} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "details" && (
        <Card className="mt-6">
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Edit Product</h3></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Product Name" error={errors.name?.message} {...register("name")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Category" options={categories.map((c) => ({ value: c.id, label: c.name }))} {...register("categoryId")} />
                <Select label="Brand" options={brands.map((b) => ({ value: b.id, label: b.name }))} placeholder="No brand" {...register("brandId")} />
              </div>
              <Select label="Supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="No supplier" {...register("supplierId")} />
              <Textarea label="Description" {...register("description")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Cost Price" type="number" step="0.01" {...register("costPrice")} />
                <Input label="Selling Price" type="number" step="0.01" {...register("sellingPrice")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Tax Rate" options={TAX_RATES.map((t) => ({ value: t.value, label: t.label }))} {...register("taxRate", { valueAsNumber: true })} />
                <Select label="Unit" options={UNITS.map((u) => ({ value: u.value, label: u.label }))} {...register("unit")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Min Stock" type="number" {...register("minStock", { valueAsNumber: true })} />
                <Input label="Max Stock" type="number" {...register("maxStock", { valueAsNumber: true })} />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button type="submit" isLoading={isLoading}>Save Changes</Button>
                <Button type="button" variant="secondary" onClick={() => router.push("/products")}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "history" && (
        <Card className="mt-6">
          <CardContent className="py-8 text-center text-gray-500">
            <p>Product history will appear here as changes are made.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
