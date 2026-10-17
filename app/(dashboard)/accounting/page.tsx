"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { Tabs } from "@/components/ui/tabs"
import { ReportToolbar, useReportRange } from "@/components/reports/report-toolbar"
import { inRange, summarize } from "@/lib/utils/analytics"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { Plus, DollarSign, TrendingUp, TrendingDown, BookOpen, Wallet } from "lucide-react"

const EXPENSE_CATEGORIES = ["Rent", "Salaries", "Utilities", "Transport", "Marketing", "Supplies", "Maintenance", "Petty cash", "Other"]

export default function AccountingPage() {
  const { addTransaction, products, branches, logAudit } = useDataStore()
  const user = useAuthStore((s) => s.user)
  const { sales, transactions, label: branchLabel } = useBranchFilter()
  const state = useReportRange("month")
  const [activeTab, setActiveTab] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: "expense", category: "Transport", amount: "", description: "", reference: "", branchId: user?.branchId ?? "" })
  const [error, setError] = useState("")

  const view = useMemo(() => {
    const inPeriod = transactions.filter((t) => inRange(t.date, state.range))
    const sum = summarize(sales.filter((s) => inRange(s.createdAt, state.range)), products)
    const expenses = inPeriod.filter((t) => t.type === "expense")
    const income = inPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const byCategory = new Map<string, number>()
    expenses.forEach((t) => byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount))
    const filtered = activeTab === "all" ? inPeriod : inPeriod.filter((t) => t.type === activeTab)
    return { sum, income, expenseTotal: expenses.reduce((s, t) => s + t.amount, 0), byCategory: [...byCategory.entries()].sort((a, b) => b[1] - a[1]), filtered }
  }, [transactions, sales, products, state.range, activeTab])

  const netProfit = view.sum.grossProfit + view.income - view.expenseTotal

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (Number.isNaN(amount) || amount <= 0) return setError("Enter an amount.")
    if (!form.description.trim()) return setError("Add a short description.")
    const now = new Date().toISOString()
    addTransaction({
      id: generateId(), businessId: user?.businessId ?? "", branchId: form.branchId || undefined, type: form.type as "income" | "expense",
      category: form.category, amount, description: form.description.trim(), reference: form.reference || undefined, date: now, createdAt: now,
    })
    logAudit(form.type === "expense" ? "Expense recorded" : "Income recorded", "Accounting", `${form.category}: KES ${amount.toLocaleString()} (${form.description.trim()})`)
    notify.success(form.type === "expense" ? "Expense recorded" : "Income recorded", `${form.category} · ${formatCurrency(amount)}`)
    setShowModal(false)
    setForm({ ...form, amount: "", description: "", reference: "" })
    setError("")
  }

  const exportRows = () => view.filtered.map((t) => ({ Date: t.date.slice(0, 10), Type: t.type, Category: t.category, Description: t.description, Reference: t.reference ?? "", Branch: branches.find((b) => b.id === t.branchId)?.name ?? "All", Amount: t.amount }))

  return (
    <div className="print-area space-y-6">
      <PageHeader title="Accounting" description="Income, expenses and profit that account for what the goods cost">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Record expense</Button>
        <Link href="/reports/profit"><Button variant="secondary"><BookOpen className="h-4 w-4" />Profit report</Button></Link>
      </PageHeader>
      <ReportToolbar state={state} branchLabel={branchLabel} rows={exportRows} filename="accounting" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Net sales" value={formatCurrency(view.sum.net)} icon={DollarSign} />
        <StatsCard title="Gross profit" value={formatCurrency(view.sum.grossProfit)} icon={TrendingUp} change={`${view.sum.margin.toFixed(1)}% margin`} changeType="positive" />
        <StatsCard title="Expenses" value={formatCurrency(view.expenseTotal)} changeType="negative" icon={TrendingDown} />
        <StatsCard title="Net profit" value={formatCurrency(netProfit)} icon={Wallet} changeType={netProfit >= 0 ? "positive" : "negative"} change={netProfit >= 0 ? "After expenses" : "Spending more than earning"} />
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Where the money went</h3></CardHeader>
        <CardContent className="space-y-3">
          {view.byCategory.length === 0 && <p className="py-4 text-center text-sm text-gray-500">No expenses recorded in this period.</p>}
          {view.byCategory.map(([category, amount]) => (
            <div key={category}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-gray-900">{category}</span><span className="text-gray-500">{formatCurrency(amount)} · {Math.round((amount / (view.expenseTotal || 1)) * 100)}%</span></div>
              <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${(amount / (view.byCategory[0][1] || 1)) * 100}%`, background: "var(--series-2)" }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <div className="px-6 pt-4 no-print">
          <Tabs tabs={[{ id: "all", label: "All" }, { id: "income", label: "Income" }, { id: "expense", label: "Expenses" }]} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Branch</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {view.filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-gray-500">No transactions in this period.</TableCell></TableRow>
            ) : view.filtered.slice(0, 100).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.description}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell className="text-gray-500">{branches.find((b) => b.id === t.branchId)?.name ?? "All"}</TableCell>
                <TableCell><Badge variant={t.type === "income" ? "success" : "danger"}>{t.type}</Badge></TableCell>
                <TableCell className={t.type === "income" ? "text-green-600" : "text-red-600"}>{t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}</TableCell>
                <TableCell className="text-gray-500">{formatDateTime(t.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {view.filtered.length > 100 && <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-500">Showing the latest 100 of {view.filtered.length}. Export for the full list.</p>}
      </CardContent></Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} title="Record a transaction" size="md">
        <form onSubmit={submit} className="space-y-4">
          <Select label="Type" options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Other income" }]} value={form.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, type: e.target.value })} />
          <Select label="Category" options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))} value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value })} />
          <Select label="Branch" placeholder="Shared across branches" options={branches.map((b) => ({ value: b.id, label: b.name }))} value={form.branchId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, branchId: e.target.value })} />
          <Input label="Amount (KES)" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Reference (optional)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
