"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatsCard } from "@/components/ui/stats-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/format"
import { ROLES } from "@/lib/constants"
import { Users, UserCog, DollarSign, Download } from "lucide-react"

export default function StaffReportsPage() {
  const { employees, users } = useDataStore()
  const getRole = (r: string) => ROLES.find((rl) => rl.value === r)?.label || r

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Reports" description="Employee performance metrics">
        <Button variant="secondary"><Download className="h-4 w-4" />Export</Button>
      </PageHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Staff" value={employees.length.toString()} icon={Users} />
        <StatsCard title="Active Staff" value={employees.filter((e) => e.isActive).length.toString()} icon={UserCog} />
        <StatsCard title="Avg Salary" value={formatCurrency(employees.reduce((s, e) => s + (e.salary || 0), 0) / (employees.length || 1))} icon={DollarSign} />
      </div>
      <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900">Staff Details</h3></CardHeader>
        <CardContent className="p-0">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{employees.map((emp) => {
            const user = users.find((u) => u.id === emp.userId)
            return (<TableRow key={emp.id}>
              <TableCell className="font-medium">{user?.name || "Unknown"}</TableCell>
              <TableCell><Badge>{getRole(emp.role)}</Badge></TableCell>
              <TableCell><Badge variant={emp.isActive ? "success" : "default"}>{emp.isActive ? "Active" : "Inactive"}</Badge></TableCell>
            </TableRow>)
          })}</TableBody></Table>
        </CardContent></Card>
    </div>
  )
}
