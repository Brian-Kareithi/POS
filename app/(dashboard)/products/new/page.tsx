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
import { generateId, generateSKU, generateBarcode } from "@/lib/utils/generators"
import { TAX_RATES, UNITS } from "@/lib/constants"

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
})

type ProductForm = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { categories, brands, suppliers, addProduct, business } = useDataStore()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { taxRate: 0, unit: "piece", minStock: 0, maxStock: 100 },
  })

  const name = watch("name")
  const categoryId = watch("categoryId")

  const onSubmit = async (data: ProductForm) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    addProduct({
      id: generateId(),
      businessId: business?.id || "",
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, "-"),
      sku: generateSKU(data.name, categories.find((c) => c.id === data.categoryId)?.name || ""),
      barcode: generateBarcode(),
      categoryId: data.categoryId,
      brandId: data.brandId || undefined,
      supplierId: data.supplierId || undefined,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      taxRate: data.taxRate,
      unit: data.unit,
      minStock: data.minStock,
      maxStock: data.maxStock,
      isActive: true,
      hasVariants: false,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
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
            <div className="grid grid-cols-2 gap-4">
              <Select label="Category" options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select category" error={errors.categoryId?.message} {...register("categoryId")} />
              <Select label="Brand" options={brands.map((b) => ({ value: b.id, label: b.name }))} placeholder="Select brand" {...register("brandId")} />
            </div>
            <Select label="Supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select supplier" {...register("supplierId")} />
            <Textarea label="Description" {...register("description")} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cost Price" type="number" step="0.01" error={errors.costPrice?.message} {...register("costPrice")} />
              <Input label="Selling Price" type="number" step="0.01" error={errors.sellingPrice?.message} {...register("sellingPrice")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Tax Rate" options={TAX_RATES.map((t) => ({ value: t.value, label: t.label }))} {...register("taxRate", { valueAsNumber: true })} />
              <Select label="Unit" options={UNITS.map((u) => ({ value: u.value, label: u.label }))} {...register("unit")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
    </div>
  )
}
