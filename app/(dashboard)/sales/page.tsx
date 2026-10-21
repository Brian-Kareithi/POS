"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { can } from "@/lib/permissions"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { refundState } from "@/lib/utils/refunds"
import { exportCSV } from "@/lib/utils/export"
import { ShoppingCart, DollarSign, RefreshCw, FileText, Download, HandCoins, WifiOff } from "lucide-react"

const methodLabel = PAYMENT_METHOD_LABELS
const FILTERS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "owing", label: "Part paid" },
  { id: "refunded", label: "Refunded" },
  { id: "cancelled", label: "Voided" },
] as const

export default function SalesPage() {
  const customers = useDataStore((s) => s.customers)
  const users = useDataStore((s) => s.users)
  const branches = useDataStore((s) => s.branches)
  const user = useAuthStore((s) => s.user)
  const { sales: allSales, label } = useBranchFilter()
  // Cashiers only see their own sales; managers and owners see everyone's.
  const sales = useMemo(() => (can(user?.role, "reports.view") ? allSales : allSales.filter((s) => s.userId === user?.id)), [allSales, user])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all")

  const customerName = (id?: string) => customers.find((c) => c.id === id)?.name ?? "Walk-in"
  const cashierName = (id: string) => users.find((u) => u.id === id)?.name ?? "-"

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sales.filter((s) => {
      if (filter === "owing" ? !s.amountDue : filter !== "all" && s.status !== filter) return false
      if (!q) return true
      const c = customers.find((x) => x.id === s.customerId)
      return [s.orderNumber, s.receiptNumber, s.reference, c?.name, c?.phone].some((v) => v?.toLowerCase().includes(q))
    })
  }, [sales, search, filter, customers])

  const completed = sales.filter((s) => s.status === "completed")
  const revenue = completed.reduce((sum, s) => sum + s.total, 0)
  const owed = completed.reduce((sum, s) => sum + (s.amountDue ?? 0), 0)
  const pendingSync = sales.filter((s) => s.synced === false).length

  const exportRows = () =>
    exportCSV(
      filtered.map((s) => ({
        Receipt: s.receiptNumber ?? s.orderNumber, Date: new Date(s.createdAt).toLocaleString("en-KE"), Branch: branches.find((b) => b.id === s.branchId)?.name ?? "",
        Cashier: cashierName(s.userId), Customer: customerName(s.customerId), Payment: methodLabel[s.paymentMethod], Reference: s.reference ?? "",
        Subtotal: s.subtotal, Discount: s.discountTotal, VAT: s.taxTotal, Total: s.total, "Balance due": s.amountDue ?? 0, Status: s.status,
      })),
      "sales"
    )

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description={`${label} · ${sales.length.toLocaleString()} transactions`}>
        {can(user?.role, "pos.sell") && <Link href="/"><Button><ShoppingCart className="h-4 w-4" />New Sale</Button></Link>}
        {can(user?.role, "reports.export") && <Button variant="secondary" onClick={exportRows}><Download className="h-4 w-4" />Export CSV</Button>}
        <Link href="/sales/returns"><Button variant="secondary"><RefreshCw className="h-4 w-4" />Returns</Button></Link>
        <Link href="/sales/quotes"><Button variant="secondary"><FileText className="h-4 w-4" />Quotes</Button></Link>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Revenue" value={formatCurrency(revenue)} icon={DollarSign} />
        <StatsCard title="Completed Sales" value={completed.length.toLocaleString()} icon={ShoppingCart} />
        <StatsCard title="Owed by customers" value={formatCurrency(owed)} icon={HandCoins} changeType={owed > 0 ? "negative" : "neutral"} change={pendingSync ? `${pendingSync} waiting to sync` : undefined} />
      </div>

      <Card><CardContent className="space-y-3 p-4">
        <SearchInput placeholder="Search receipt, customer, phone or M-Pesa code..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${filter === f.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{f.label}</button>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Customer</TableHead><TableHead>Cashier</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No sales match. Try a different search or filter.</TableCell></TableRow>
            ) : filtered.slice(0, 100).map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">
                  <Link href={`/sales/${sale.id}`} className="text-blue-600 hover:text-blue-700">{sale.receiptNumber ?? sale.orderNumber}</Link>
                  {sale.synced === false && <WifiOff className="ml-1.5 inline h-3.5 w-3.5 text-orange-500" aria-label="Waiting to sync" />}
                </TableCell>
                <TableCell>{customerName(sale.customerId)}</TableCell>
                <TableCell className="text-gray-500">{cashierName(sale.userId)}</TableCell>
                <TableCell>{sale.items?.length || 0}</TableCell>
                <TableCell>{formatCurrency(sale.total)}{sale.refundedAmount ? <span className="block text-xs text-orange-700">-{formatCurrency(sale.refundedAmount)} refunded</span> : null}{sale.amountDue ? <span className="block text-xs text-orange-600">{formatCurrency(sale.amountDue)} due</span> : null}</TableCell>
                <TableCell>{methodLabel[sale.paymentMethod]}</TableCell>
                <TableCell><Badge variant={refundState(sale) === "partial" ? "warning" : refundState(sale) === "full" || sale.status === "refunded" || sale.status === "cancelled" ? "danger" : sale.status === "completed" ? "success" : "default"}>{sale.status === "cancelled" ? "voided" : refundState(sale) === "partial" ? "partly refunded" : refundState(sale) === "full" ? "refunded" : sale.status}</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(sale.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length > 100 && <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-500">Showing the latest 100 of {filtered.length.toLocaleString()}. Narrow the search or export for the full list.</p>}
      </CardContent></Card>
    </div>
  )
}
