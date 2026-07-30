"use client"

import { useParams, useRouter } from "next/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ArrowLeft, Mail, Phone, MapPin, Award, CreditCard, Cake } from "lucide-react"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customers = useDataStore((s) => s.customers)
  const sales = useDataStore((s) => s.sales)
  const customer = customers.find((c) => c.id === params.id)

  if (!customer) {
    return <div className="text-center py-16 text-gray-500">Customer not found</div>
  }

  const customerSales = sales.filter((s) => s.customerId === customer.id)

  return (
    <div className="max-w-3xl">
      <PageHeader title={customer.name} description={`Customer since ${formatDate(customer.createdAt)}`}>
        <Button variant="secondary" onClick={() => router.push("/customers")}><ArrowLeft className="h-4 w-4" />Back</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="py-4 space-y-3">
          <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gray-400" />{customer.email}</div>
          <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-gray-400" />{customer.phone}</div>
          {customer.address && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-gray-400" />{customer.address}</div>}
          {customer.birthday && <div className="flex items-center gap-2 text-sm"><Cake className="h-4 w-4 text-gray-400" />{formatDate(customer.birthday)}</div>}
        </CardContent></Card>
        <Card><CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Group</span><Badge>{customer.group?.name || "Regular"}</Badge></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><Award className="h-4 w-4" />Points</span><span className="font-semibold">{customer.loyaltyPoints}</span></div>
          <div className="flex items-center justify-between text-sm"><span className="text-gray-500 flex items-center gap-1"><CreditCard className="h-4 w-4" />Credit</span><span className="font-semibold text-green-600">{formatCurrency(customer.storeCredit)}</span></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Purchase History ({customerSales.length} orders)</h3></CardHeader>
        <CardContent className="p-0">
          {customerSales.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No purchases yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {customerSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.orderNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(sale.total)}</p>
                    <Badge variant={sale.status === "completed" ? "success" : "default"} className="mt-0.5">{sale.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
