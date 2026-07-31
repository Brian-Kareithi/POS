"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId, generateOrderNumber } from "@/lib/utils/generators"

const schema = z.object({ supplierId: z.string().min(1), warehouseId: z.string().min(1), notes: z.string().optional() })

export default function PurchaseOrdersPage() {
  const { purchaseOrders, suppliers, warehouses, addPurchaseOrder } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: z.infer<typeof schema>) => {
    addPurchaseOrder({ id: generateId(), businessId: "", orderNumber: generateOrderNumber(), status: "draft", total: 0, ...data, items: [], createdBy: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" description={`${purchaseOrders.length} orders`}>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />New Order</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Supplier</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
        <TableBody>{purchaseOrders.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No purchase orders yet</TableCell></TableRow>
        ) : purchaseOrders.map((po) => (
          <TableRow key={po.id}>
            <TableCell className="font-medium">{po.orderNumber}</TableCell>
            <TableCell>{suppliers.find((s) => s.id === po.supplierId)?.name || "N/A"}</TableCell>
            <TableCell>{formatCurrency(po.total)}</TableCell>
            <TableCell><Badge variant={po.status === "received" ? "success" : po.status === "cancelled" ? "danger" : po.status === "approved" ? "info" : "warning"}>{po.status}</Badge></TableCell>
            <TableCell className="text-gray-500">{formatDateTime(po.createdAt)}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="New Purchase Order" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select supplier" {...register("supplierId")} />
          <Select label="Warehouse" options={warehouses.map((w) => ({ value: w.id, label: w.name }))} placeholder="Select warehouse" {...register("warehouseId")} />
          <Input label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Create Order</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
