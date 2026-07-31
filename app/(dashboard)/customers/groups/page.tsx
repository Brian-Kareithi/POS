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

const schema = z.object({ name: z.string().min(1), discountPercent: z.coerce.number().min(0).max(100) })

export default function CustomerGroupsPage() {
  const { customerGroups, addCustomerGroup } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: z.infer<typeof schema>) => {
    addCustomerGroup({ id: generateId(), businessId: "", name: data.name, discountPercent: data.discountPercent, isActive: true })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Groups" description="Manage customer segments">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Group</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Discount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{customerGroups.map((g) => (
          <TableRow key={g.id}>
            <TableCell className="font-medium">{g.name}</TableCell>
            <TableCell>{g.discountPercent}%</TableCell>
            <TableCell><Badge variant={g.isActive ? "success" : "default"}>{g.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Customer Group" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Group Name" error={errors.name?.message as string} {...register("name")} />
          <Input label="Discount (%)" type="number" error={errors.discountPercent?.message as string} {...register("discountPercent", { valueAsNumber: true })} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
