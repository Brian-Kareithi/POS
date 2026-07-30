"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { Plus, Users, Award, CreditCard } from "lucide-react"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export default function CustomersPage() {
  const { customers, addCustomer } = useDataStore()
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const filtered = useMemo(() =>
    customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    ), [customers, search])

  const onSubmit = (data: any) => {
    addCustomer({
      id: generateId(), businessId: "", name: data.name, email: data.email,
      phone: data.phone, address: data.address, notes: data.notes,
      loyaltyPoints: 0, storeCredit: 0, isActive: true, createdAt: new Date().toISOString(),
    })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description={`${customers.length} registered customers`}>
        <Link href="/customers/groups"><Button variant="secondary">Groups</Button></Link>
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Customer</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Customers" value={customers.length.toString()} icon={Users} />
        <StatsCard title="Total Points" value={customers.reduce((s, c) => s + c.loyaltyPoints, 0).toLocaleString()} icon={Award} />
        <StatsCard title="Store Credit" value={formatCurrency(customers.reduce((s, c) => s + c.storeCredit, 0))} icon={CreditCard} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Points</TableHead><TableHead>Credit</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No customers found.</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell><Link href={`/customers/${c.id}`} className="font-medium text-blue-600 hover:text-blue-700">{c.name}</Link></TableCell>
                <TableCell className="text-gray-500">{c.email}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.loyaltyPoints}</TableCell>
                <TableCell>{formatCurrency(c.storeCredit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Customer" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" error={errors.name?.message as string} {...register("name")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" error={errors.email?.message as string} {...register("email")} />
            <Input label="Phone" error={errors.phone?.message as string} {...register("phone")} />
          </div>
          <Input label="Address" {...register("address")} />
          <Input label="Notes" {...register("notes")} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
