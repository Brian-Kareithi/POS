"use client"

import { useState, useMemo } from "react"
import { useDataStore } from "@/lib/stores/data-store"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { Tabs } from "@/components/ui/tabs"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { TRANSACTION_TYPES } from "@/lib/constants"
import { Plus, DollarSign, TrendingUp, TrendingDown, BookOpen } from "lucide-react"
import Link from "next/link"

const schema = z.object({ type: z.enum(["income", "expense"]), category: z.string().min(1), amount: z.coerce.number().min(0), description: z.string().min(1), reference: z.string().optional() })

export default function AccountingPage() {
  const { transactions, addTransaction, sales } = useDataStore()
  const [activeTab, setActiveTab] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const filtered = useMemo(() => {
    const all = transactions
    if (activeTab === "income") return all.filter((t) => t.type === "income")
    if (activeTab === "expense") return all.filter((t) => t.type === "expense")
    return all
  }, [transactions, activeTab])

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const salesRevenue = sales.reduce((s, sale) => s + sale.total, 0)

  const onSubmit = (data: any) => {
    addTransaction({ id: generateId(), businessId: "", branchId: "", ...data, date: new Date().toISOString(), createdAt: new Date().toISOString() })
    reset(); setShowModal(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Accounting" description="Track income, expenses, and taxes">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Add Transaction</Button>
        <Link href="/accounting/reports"><Button variant="secondary"><BookOpen className="h-4 w-4" />Reports</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Sales Revenue" value={formatCurrency(salesRevenue)} icon={DollarSign} />
        <StatsCard title="Total Income" value={formatCurrency(totalIncome)} changeType="positive" icon={TrendingUp} />
        <StatsCard title="Total Expenses" value={formatCurrency(totalExpenses)} changeType="negative" icon={TrendingDown} />
      </div>

      <Card><CardContent className="p-0">
        <div className="px-6 pt-4">
          <Tabs tabs={[{ id: "all", label: "All" }, { id: "income", label: "Income" }, { id: "expense", label: "Expenses" }]} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No transactions yet.</TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.description}</TableCell>
                <TableCell className="capitalize">{t.category}</TableCell>
                <TableCell><Badge variant={t.type === "income" ? "success" : "danger"}>{t.type}</Badge></TableCell>
                <TableCell className={t.type === "income" ? "text-green-600" : "text-red-600"}>{t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                <TableCell className="text-gray-500">{formatDateTime(t.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Add Transaction" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Type" options={TRANSACTION_TYPES.map((t) => ({ value: t.value, label: t.label }))} {...register("type")} />
          <Input label="Category" placeholder="e.g., Rent, Utilities" {...register("category")} />
          <Input label="Amount" type="number" step="0.01" {...register("amount")} />
          <Input label="Description" {...register("description")} />
          <Input label="Reference" {...register("reference")} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
