"use client"

import { useState } from "react"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import type { Employee, Role, User } from "@/lib/types"
import { Plus, UserCog, Users, Clock, Check, Minus } from "lucide-react"

const ROLE_ORDER: Role[] = ["owner", "manager", "cashier", "stockkeeper"]
const roleVariant: Record<Role, "info" | "success" | "default" | "warning"> = { owner: "info", manager: "success", cashier: "default", stockkeeper: "warning" }

export default function EmployeesPage() {
  const { employees, users, branches, setEmployees, setUsers, logAudit } = useDataStore()
  const me = useAuthStore((s) => s.user)
  const canManage = can(me?.role, "staff.manage")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "cashier" as Role, branchId: branches[0]?.id ?? "", salary: "" })
  const [error, setError] = useState("")

  const userOf = (id: string) => users.find((u) => u.id === id)
  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name ?? "All branches"
  const activeCount = employees.filter((e) => e.isActive).length
  const payroll = employees.reduce((s, e) => s + (e.salary || 0), 0)

  const changeRole = (employee: Employee, role: Role) => {
    const user = userOf(employee.userId)
    if (!user || user.id === me?.id) return
    setEmployees(employees.map((e) => (e.id === employee.id ? { ...e, role } : e)))
    setUsers(users.map((u) => (u.id === user.id ? { ...u, role } : u)))
    logAudit("Staff role changed", "Staff", `${user.name}: ${ROLE_LABELS[employee.role]} → ${ROLE_LABELS[role]}`, "warning")
    notify.success("Role updated", `${user.name} is now ${ROLE_LABELS[role]}`)
  }

  const changeBranch = (employee: Employee, branchId: string) => {
    const user = userOf(employee.userId)
    if (!user) return
    setEmployees(employees.map((e) => (e.id === employee.id ? { ...e, branchId } : e)))
    setUsers(users.map((u) => (u.id === user.id ? { ...u, branchId } : u)))
    logAudit("Staff branch changed", "Staff", `${user.name} now works at ${branchName(branchId)}`)
    notify.success("Branch updated", `${user.name} · ${branchName(branchId)}`)
  }

  const toggleActive = (employee: Employee) => {
    const user = userOf(employee.userId)
    if (!user || user.id === me?.id) return
    setEmployees(employees.map((e) => (e.id === employee.id ? { ...e, isActive: !e.isActive } : e)))
    logAudit(employee.isActive ? "Staff switched off" : "Staff switched on", "Staff", `${user.name}'s account ${employee.isActive ? "can no longer sign in" : "can sign in again"}`, "warning")
    notify.success(employee.isActive ? "Account switched off" : "Account switched on", user.name)
  }

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    if (!form.name.trim() || !email.includes("@")) return setError("Enter a name and a valid email.")
    if (users.some((u) => u.email.toLowerCase() === email)) return setError("Someone already uses that email.")
    const now = new Date().toISOString()
    const user: User = {
      id: generateId(), email, name: form.name.trim(), role: form.role, businessId: me?.businessId ?? "", branchId: form.branchId, phone: form.phone,
      emailVerified: true, twoFactorEnabled: false, createdAt: now, updatedAt: now,
    }
    const employee: Employee = {
      id: generateId(), userId: user.id, businessId: user.businessId, branchId: form.branchId, role: form.role,
      salary: form.salary ? parseFloat(form.salary) : undefined, hireDate: now.slice(0, 10), isActive: true,
    }
    setUsers([...users, user])
    setEmployees([...employees, employee])
    logAudit("Staff added", "Staff", `${user.name} added as ${ROLE_LABELS[form.role]} at ${branchName(form.branchId)}`)
    notify.success("Staff member added", `${user.name} can now sign in with ${email}`)
    setOpen(false)
    setForm({ ...form, name: "", email: "", phone: "", salary: "" })
    setError("")
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description={`${employees.length} staff members · who can do what`}>
        <Link href="/employees/shifts"><Button variant="secondary"><Clock className="h-4 w-4" />Shifts & cash</Button></Link>
        {canManage && <Button onClick={() => { setOpen(true); setError("") }}><Plus className="h-4 w-4" />Add staff</Button>}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Total staff" value={employees.length.toString()} icon={Users} />
        <StatsCard title="Active" value={activeCount.toString()} icon={UserCog} />
        {canManage && <StatsCard title="Monthly payroll" value={formatCurrency(payroll)} icon={Users} />}
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Works at</TableHead>{canManage && <TableHead>Salary</TableHead>}<TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const user = userOf(emp.userId)
              const self = user?.id === me?.id
              return (
                <TableRow key={emp.id}>
                  <TableCell><span className="font-medium">{user?.name ?? "Unknown"}</span><span className="block text-xs text-gray-400">{user?.email}</span></TableCell>
                  <TableCell>
                    {canManage && !self ? (
                      <select value={emp.role} onChange={(e) => changeRole(emp, e.target.value as Role)} aria-label={`Role for ${user?.name}`} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm">
                        {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : <Badge variant={roleVariant[emp.role]}>{ROLE_LABELS[emp.role]}</Badge>}
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <select value={emp.branchId ?? ""} onChange={(e) => changeBranch(emp, e.target.value)} aria-label={`Branch for ${user?.name}`} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm">
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    ) : branchName(emp.branchId)}
                  </TableCell>
                  {canManage && <TableCell>{emp.salary ? formatCurrency(emp.salary) : "—"}</TableCell>}
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Badge variant={emp.isActive ? "success" : "default"}>{emp.isActive ? "Active" : "Off"}</Badge>
                      {canManage && !self && <button onClick={() => toggleActive(emp)} className="text-xs text-blue-600 hover:underline">{emp.isActive ? "Switch off" : "Switch on"}</button>}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">What each role can do</h3><p className="text-xs text-gray-500">Refunds, price changes and stock edits are limited to the right people. Cashiers can ask a manager to approve with a PIN.</p></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  {ROLE_ORDER.map((r) => <TableHead key={r}>{ROLE_LABELS[r]}<span className="block text-[10px] font-normal text-gray-400">{ROLE_DESCRIPTIONS[r].split(".")[0]}</span></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                  <TableRow key={p}>
                    <TableCell>{PERMISSION_LABELS[p]}</TableCell>
                    {ROLE_ORDER.map((r) => (
                      <TableCell key={r}>{ROLE_PERMISSIONS[r].includes(p) ? <Check className="h-4 w-4 text-green-600" aria-label="Allowed" /> : <Minus className="h-4 w-4 text-gray-300" aria-label="Not allowed" />}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add staff member" size="md">
        <form onSubmit={add} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <Input label="Email (used to sign in)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0712 345 678" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Role" options={ROLE_ORDER.filter((r) => r !== "owner").map((r) => ({ value: r, label: ROLE_LABELS[r] }))} value={form.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, role: e.target.value as Role })} />
            <Select label="Branch" options={branches.map((b) => ({ value: b.id, label: b.name }))} value={form.branchId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, branchId: e.target.value })} />
          </div>
          <Input label="Monthly salary (KES, optional)" type="number" min="0" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[form.role]}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add staff</Button></div>
        </form>
      </Dialog>
    </div>
  )
}
