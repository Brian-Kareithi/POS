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
import { generateId } from "@/lib/utils/generators"
import { STOCK_TRANSFER_STATUSES } from "@/lib/constants"
import { formatDateTime } from "@/lib/utils/format"

const schema = z.object({ productId: z.string().min(1), fromWarehouseId: z.string().min(1), toWarehouseId: z.string().min(1), quantity: z.coerce.number().min(1), notes: z.string().optional() })

export default function TransfersPage() {
  const { stockTransfers, products, warehouses, addStockTransfer } = useDataStore()
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: z.infer<typeof schema>) => {
    addStockTransfer({ id: generateId(), businessId: "", ...data, status: "pending", createdBy: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    reset(); setShowModal(false)
  }

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || "N/A"
  const getWarehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name || "N/A"

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Transfers" description={`${stockTransfers.length} transfers`}>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />New Transfer</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
        <TableBody>{stockTransfers.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No transfers yet</TableCell></TableRow>
        ) : stockTransfers.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-medium">{getProductName(t.productId)}</TableCell>
            <TableCell>{getWarehouseName(t.fromWarehouseId)}</TableCell>
            <TableCell>{getWarehouseName(t.toWarehouseId)}</TableCell>
            <TableCell>{t.quantity}</TableCell>
            <TableCell><Badge variant={t.status === "completed" ? "success" : t.status === "cancelled" ? "danger" : "warning"}>{t.status}</Badge></TableCell>
            <TableCell className="text-gray-500">{formatDateTime(t.createdAt)}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={showModal} onClose={() => setShowModal(false)} title="New Stock Transfer" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Product" options={products.map((p) => ({ value: p.id, label: p.name }))} placeholder="Select product" {...register("productId")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="From Warehouse" options={warehouses.map((w) => ({ value: w.id, label: w.name }))} placeholder="Select source" {...register("fromWarehouseId")} />
            <Select label="To Warehouse" options={warehouses.map((w) => ({ value: w.id, label: w.name }))} placeholder="Select destination" {...register("toWarehouseId")} />
          </div>
          <Input label="Quantity" type="number" min={1} {...register("quantity")} />
          <Input label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Create Transfer</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
