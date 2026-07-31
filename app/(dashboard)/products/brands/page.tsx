"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { generateId } from "@/lib/utils/generators"

const schema = z.object({ name: z.string().min(1), description: z.string().optional() })

export default function BrandsPage() {
  const { brands, addBrand } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: z.infer<typeof schema>) => {
    addBrand({ id: generateId(), businessId: "", name: data.name, slug: data.name.toLowerCase().replace(/\s+/g, "-"), description: data.description, isActive: true, createdAt: new Date().toISOString() })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Brands" description={`${brands.length} brands`}>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Brand</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{brands.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-medium">{b.name}</TableCell>
            <TableCell className="text-gray-500">{b.slug}</TableCell>
            <TableCell><Badge variant={b.isActive ? "success" : "default"}>{b.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Brand" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" error={errors.name?.message as string} {...register("name")} />
          <Input label="Description" {...register("description")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
