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

const schema = z.object({ name: z.string().min(1), contactPerson: z.string().min(1), email: z.string().email(), phone: z.string().min(1), address: z.string().optional() })

export default function SuppliersPage() {
  const { suppliers, addSupplier } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: z.infer<typeof schema>) => {
    addSupplier({ id: generateId(), businessId: "", ...data, address: data.address || "", isActive: true, createdAt: new Date().toISOString() })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description={`${suppliers.length} suppliers`}>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Supplier</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{suppliers.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell>{s.contactPerson}</TableCell>
            <TableCell>{s.email}</TableCell>
            <TableCell>{s.phone}</TableCell>
            <TableCell><Badge variant={s.isActive ? "success" : "default"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Supplier" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Company Name" error={errors.name?.message as string} {...register("name")} />
          <Input label="Contact Person" error={errors.contactPerson?.message as string} {...register("contactPerson")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" error={errors.email?.message as string} {...register("email")} />
            <Input label="Phone" error={errors.phone?.message as string} {...register("phone")} />
          </div>
          <Input label="Address" {...register("address")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
