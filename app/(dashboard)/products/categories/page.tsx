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

const schema = z.object({ name: z.string().min(1, "Name is required"), description: z.string().optional() })

export default function CategoriesPage() {
  const { categories, addCategory } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: any) => {
    addCategory({ id: generateId(), businessId: "", name: data.name, slug: data.name.toLowerCase().replace(/\s+/g, "-"), description: data.description, isActive: true, parentId: undefined, createdAt: new Date().toISOString() })
    reset()
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description={`${categories.length} categories`}>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Category</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-gray-500">{c.slug}</TableCell>
              <TableCell><Badge variant={c.isActive ? "success" : "default"}>{c.isActive ? "Active" : "Inactive"}</Badge></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Category" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" error={errors.name?.message as string} {...register("name")} />
          <Input label="Description" {...register("description")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
