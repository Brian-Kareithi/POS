"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { notify } from "@/lib/toast"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ArrowLeft, Mail, Phone, MapPin, Award, CreditCard, Cake, HandCoins, MessageSquareOff, MessageSquare } from "lucide-react"

const methods = [
  { value: "Cash", label: "Cash" },
  { value: "M-Pesa", label: "M-Pesa" },
  { value: "Bank transfer", label: "Bank transfer" },
]

export default function CustomerDetailPage() {
  const now = useNow()
  const params = useParams()
  const router = useRouter()
  const customers = useDataStore((s) => s.customers)
  const groups = useDataStore((s) => s.customerGroups)
  const sales = useDataStore((s) => s.sales)
  const recordCustomerPayment = useDataStore((s) => s.recordCustomerPayment)
  const customer = customers.find((c) => c.id === params.id)
  const [paying, setPaying] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("M-Pesa")
  const [error, setError] = useState("")

  if (!customer) {
    return <div className="text-center py-16 text-gray-500">Customer not found</div>
  }

  const customerSales = sales.filter((s) => s.customerId === customer.id && s.status === "completed")
  const owed = customer.amountOwed ?? 0
  const limit = customer.creditLimit ?? 0
  const overdue = !!customer.creditDueDate && owed > 0 && new Date(customer.creditDueDate).getTime() < now
  const group = groups.find((g) => g.id === customer.groupId)?.name ?? "Regular"
  const spent = customerSales.reduce((sum, s) => sum + s.total, 0)

  const pay = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (Number.isNaN(value) || value <= 0) return setError("Enter the amount received.")
    if (value > owed) return setError(`They only owe ${formatCurrency(owed)}.`)
    recordCustomerPayment(customer.id, value, method)
    notify.success("Payment recorded", `${customer.name} paid ${formatCurrency(value)} by ${method}`)
    setPaying(false)
    setAmount("")
    setError("")
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={customer.name} description={`Customer since ${formatDate(customer.createdAt)}`}>
        <Button variant="secondary" onClick={() => router.push("/customers")}><ArrowLeft className="h-4 w-4" />Back</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="py-4 space-y-3">
          {customer.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gray-400" />{customer.email}</div>}
          <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-gray-400" />{customer.phone}</div>
          {customer.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-gray-400" />{customer.address}</div>}
          {customer.birthday && <div className="flex items-center gap-2 text-sm"><Cake className="h-4 w-4 text-gray-400" />{formatDate(customer.birthday)}</div>}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {customer.marketingConsent ? <MessageSquare className="h-4 w-4 text-green-600" /> : <MessageSquareOff className="h-4 w-4 text-gray-400" />}
            {customer.marketingConsent ? "Agreed to receive receipts and offers by SMS" : "Has not agreed to marketing messages"}
          </div>
        </CardContent></Card>
        <Card><CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Group</span><Badge>{group}</Badge></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><Award className="h-4 w-4" />Loyalty points</span><span className="font-semibold">{customer.loyaltyPoints.toLocaleString()}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><CreditCard className="h-4 w-4" />Store credit</span><span className="font-semibold text-green-600">{formatCurrency(customer.storeCredit)}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Lifetime spend</span><span className="font-semibold">{formatCurrency(spent)}</span></div>
        </CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><HandCoins className="h-5 w-5 text-gray-400" />Credit account</h3>
          <Button size="sm" onClick={() => { setPaying(true); setError("") }} disabled={owed <= 0}>Record payment</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500">Owes</p><p className={`text-xl font-bold ${owed > 0 ? "text-orange-600" : "text-gray-900"}`}>{formatCurrency(owed)}</p></div>
            <div><p className="text-gray-500">Credit limit</p><p className="text-xl font-bold text-gray-900">{formatCurrency(limit)}</p></div>
            <div><p className="text-gray-500">Due</p><p className="text-xl font-bold text-gray-900">{owed > 0 && customer.creditDueDate ? formatDate(customer.creditDueDate) : "—"}</p>{overdue && <Badge variant="danger">Overdue</Badge>}</div>
          </div>
          {limit > 0 && <div className="mt-4 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, (owed / limit) * 100)}%` }} /></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Purchase History ({customerSales.length} orders)</h3></CardHeader>
        <CardContent className="p-0">
          {customerSales.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No purchases yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {customerSales.slice(0, 40).map((sale) => (
                <Link key={sale.id} href={`/sales/${sale.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.receiptNumber ?? sale.orderNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(sale.total)}</p>
                    {sale.amountDue ? <Badge variant="warning" className="mt-0.5">{formatCurrency(sale.amountDue)} due</Badge> : <Badge variant="success" className="mt-0.5">paid</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={paying} onClose={() => setPaying(false)} title="Record account payment" size="sm">
        <form onSubmit={pay} className="space-y-4">
          <p className="text-sm text-gray-500">{customer.name} owes {formatCurrency(owed)}.</p>
          <Input label="Amount received (KES)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          <Select label="Paid by" options={methods} value={method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setPaying(false)}>Cancel</Button><Button type="submit">Save payment</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
