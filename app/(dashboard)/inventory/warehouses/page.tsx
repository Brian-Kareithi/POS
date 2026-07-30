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
import { Plus, generateId } from "lucide-react"

const schema = z.object({ name: z.string().min(1), address: z.string().min(1) })

export default function WarehousesPage() {
  const { warehouses, addWarehouse } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: any) => {
    addWarehouse({ id: generateId(), businessId: "", name: data.name, address: data.address, isActive: true, createdAt: new Date().toISOString() })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouses" description={`${warehouses.length} locations`}>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Warehouse</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{warehouses.map((w) => (
          <TableRow key={w.id}>
            <TableCell className="font-medium">{w.name}</TableCell>
            <TableCell className="text-gray-500">{w.address}</TableCell>
            <TableCell><Badge variant={w.isActive ? "success" : "default"}>{w.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Warehouse" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Warehouse Name" error={errors.name?.message as string} {...register("name")} />
          <Input label="Address" error={errors.address?.message as string} {...register("address")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
