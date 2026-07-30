"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/format"
import { Users, Award, CreditCard, Download } from "lucide-react"

export default function CustomerReportsPage() {
  const customers = useDataStore((s) => s.customers)
  const totalPoints = customers.reduce((s, c) => s + c.loyaltyPoints, 0)
  const totalCredit = customers.reduce((s, c) => s + c.storeCredit, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Reports" description="Customer analytics">
        <Button variant="secondary"><Download className="h-4 w-4" />Export</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Customers" value={customers.length.toString()} icon={Users} />
        <StatsCard title="Loyalty Points" value={totalPoints.toLocaleString()} icon={Award} />
        <StatsCard title="Store Credit" value={formatCurrency(totalCredit)} icon={CreditCard} />
      </div>
      <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900">Customer List</h3></CardHeader>
        <CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Points</TableHead><TableHead>Credit</TableHead></TableRow></TableHeader>
          <TableBody>{customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-gray-500">{c.email}</TableCell>
              <TableCell>{c.loyaltyPoints}</TableCell>
              <TableCell>{formatCurrency(c.storeCredit)}</TableCell>
            </TableRow>
          ))}</TableBody></Table>
        </CardContent></Card>
    </div>
  )
}
