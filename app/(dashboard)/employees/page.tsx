"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency } from "@/lib/utils/format"
import { ROLES } from "@/lib/constants"
import { Plus, UserCog, Users, Clock } from "lucide-react"
import Link from "next/link"

export default function EmployeesPage() {
  const { employees, users } = useDataStore()

  const getUser = (userId: string) => users.find((u) => u.id === userId)
  const getRoleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label || role

  const activeEmployees = employees.filter((e) => e.isActive).length
  const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description={`${employees.length} staff members`}>
        <Link href="/employees/shifts"><Button variant="secondary"><Clock className="h-4 w-4" />Shifts</Button></Link>
        <Button><Plus className="h-4 w-4" />Add Employee</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Employees" value={employees.length.toString()} icon={Users} />
        <StatsCard title="Active Staff" value={activeEmployees.toString()} icon={UserCog} />
        <StatsCard title="Monthly Payroll" value={formatCurrency(totalSalary / 12)} icon={Clock} />
      </div>

      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Branch</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{employees.map((emp) => {
          const user = getUser(emp.userId)
          return (
            <TableRow key={emp.id}>
              <TableCell className="font-medium">{user?.name || "Unknown"}</TableCell>
              <TableCell className="text-gray-500">{user?.email || "—"}</TableCell>
              <TableCell><Badge>{getRoleLabel(emp.role)}</Badge></TableCell>
              <TableCell>{emp.branchId ? "Main Street" : "—"}</TableCell>
              <TableCell>{emp.salary ? formatCurrency(emp.salary) : "—"}</TableCell>
              <TableCell><Badge variant={emp.isActive ? "success" : "default"}>{emp.isActive ? "Active" : "Inactive"}</Badge></TableCell>
            </TableRow>
          )
        })}</TableBody></Table>
      </CardContent></Card>
    </div>
  )
}
