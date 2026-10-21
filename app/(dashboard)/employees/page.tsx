"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { can, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions"
import { ApiError, errorMessage } from "@/lib/api/client"
import { assignableRoles, staffApi, type AssignableRole } from "@/lib/api/staff"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { Tabs } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { StatsCard } from "@/components/ui/stats-card"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import type { Employee, Role } from "@/lib/types"
import { Plus, UserCog, Users, Clock, Check, Minus, Copy, Link2 } from "lucide-react"

const ROLE_ORDER: Role[] = ["owner", "manager", "cashier", "stockkeeper"]
const roleVariant = (r: Role): "info" | "success" | "default" | "warning" => (r === "owner" ? "info" : r === "manager" ? "success" : r === "stockkeeper" || r === "warehouse_clerk" ? "warning" : "default")
type Tab = "pending" | "active" | "inactive"

export default function EmployeesPage() {
  return <Suspense><Staff /></Suspense>
}

function Staff() {
  const router = useRouter()
  const params = useSearchParams()
  const { employees, users, branches, business, loaded, loadError, industry } = useDataStore()
  const assignable = assignableRoles(industry)
  const me = useAuthStore((s) => s.user)
  const canManage = can(me?.role, "staff.manage")

  const tab: Tab = params.get("tab") === "pending" ? "pending" : params.get("tab") === "inactive" ? "inactive" : "active"
  const setTab = (t: string) => router.replace(t === "active" ? "/employees" : `/employees?tab=${t}`)

  const [approving, setApproving] = useState<Employee | null>(null)
  const [declining, setDeclining] = useState<Employee | null>(null)
  const [removing, setRemoving] = useState<Employee | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const userOf = (id: string) => users.find((u) => u.id === id)
  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name ?? "All branches"

  const groups = useMemo(() => ({
    pending: employees.filter((e) => e.approval === "pending"),
    active: employees.filter((e) => e.approval !== "pending" && e.approval !== "rejected" && e.isActive),
    inactive: employees.filter((e) => e.approval === "rejected" || (e.approval !== "pending" && !e.isActive)),
  }), [employees])
  const team = groups.active
  const payroll = employees.filter((e) => e.approval === "approved").reduce((s, e) => s + (e.salary || 0), 0)
  const rows = groups[tab]

  const run = async (key: string, action: () => Promise<unknown>, success: [string, string?]) => {
    setBusy(key)
    try {
      await action()
      notify.success(success[0], success[1])
      return true
    } catch (e) {
      notify.error("That didn't work", errorMessage(e))
      return false
    } finally {
      setBusy(null)
    }
  }

  const joinLink = business?.slug && typeof window !== "undefined" ? `${window.location.origin}/join?business=${business.slug}` : ""
  const copy = async () => {
    try { await navigator.clipboard.writeText(joinLink); notify.success("Join link copied") } catch { notify.error("Could not copy", "Select the link and copy it by hand.") }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description={`${team.length} active staff · who can do what`}>
        <Link href="/employees/shifts"><Button variant="secondary"><Clock className="h-4 w-4" />Shifts & cash</Button></Link>
        {canManage && <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add staff</Button>}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Active staff" value={team.length.toString()} icon={Users} />
        <StatsCard title="Waiting for approval" value={groups.pending.length.toString()} icon={UserCog} />
        {canManage && <StatsCard title="Monthly payroll" value={formatCurrency(payroll)} icon={Users} />}
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Link2 className="h-5 w-5 text-gray-400" />Share join link</h3>
            <p className="text-xs text-gray-500">Send this to people who work for you. They create an account and wait here for your approval.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <input readOnly aria-label="Join link" value={joinLink} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" />
            <Button variant="secondary" onClick={copy} disabled={!joinLink}><Copy className="h-4 w-4" />Copy</Button>
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-0">
        <div className="px-4 pt-3 sm:px-6">
          <Tabs
            tabs={[
              { id: "pending", label: "Pending requests", count: groups.pending.length },
              { id: "active", label: "Active", count: groups.active.length },
              { id: "inactive", label: "Declined / deactivated", count: groups.inactive.length },
            ]}
            activeTab={tab}
            onTabChange={setTab}
          />
        </div>

        {!loaded ? (
          <p className="py-10 text-center text-sm text-gray-500" role="status">Loading staff…</p>
        ) : loadError && employees.length === 0 ? (
          <p className="py-10 text-center text-sm text-red-600" role="alert">Could not load staff: {loadError}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title={tab === "pending" ? "No pending requests" : tab === "active" ? "No active staff yet" : "Nobody here"}
            description={tab === "pending" ? "When someone uses your join link, they will show up here." : undefined}
          />
        ) : (
          <Table scroll>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {tab === "pending" ? <TableHead>Requested</TableHead> : <><TableHead>Role</TableHead><TableHead>Works at</TableHead>{canManage && <TableHead>Salary</TableHead>}</>}
                <TableHead>{tab === "pending" ? "Action" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((emp) => {
                const user = userOf(emp.userId)
                const self = emp.userId === me?.id
                const isOwner = emp.role === "owner"
                return (
                  <TableRow key={emp.id}>
                    <TableCell><span className="font-medium">{user?.name ?? "Unknown"}</span><span className="block text-xs text-gray-400">{user?.email}</span></TableCell>
                    {tab === "pending" ? (
                      <>
                        <TableCell className="text-gray-500">{formatDate(user?.createdAt ?? emp.hireDate)}</TableCell>
                        <TableCell>
                          {canManage ? (
                            <span className="flex flex-wrap items-center gap-2">
                              <Button size="sm" onClick={() => setApproving(emp)}>Approve</Button>
                              <Button size="sm" variant="secondary" onClick={() => setDeclining(emp)}>Decline</Button>
                            </span>
                          ) : <Badge variant="warning">Pending</Badge>}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {canManage && !self && !isOwner && tab === "active" ? (
                            <select
                              value={emp.role}
                              disabled={busy === `role-${emp.id}`}
                              onChange={(e) => run(`role-${emp.id}`, () => staffApi.changeRole(emp.id, e.target.value as Role), ["Role updated", `${user?.name} is now ${ROLE_LABELS[e.target.value as Role]}`])}
                              aria-label={`Role for ${user?.name}`}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                            >
                              {assignable.map((r) => <option key={r.role} value={r.role}>{r.label}</option>)}
                            </select>
                          ) : <Badge variant={roleVariant(emp.role)}>{ROLE_LABELS[emp.role]}</Badge>}
                        </TableCell>
                        <TableCell>
                          {canManage && tab === "active" ? (
                            <select
                              value={emp.branchId ?? ""}
                              disabled={busy === `branch-${emp.id}`}
                              onChange={(e) => run(`branch-${emp.id}`, () => staffApi.changeBranch(emp.id, e.target.value || null), ["Branch updated", `${user?.name} · ${branchName(e.target.value)}`])}
                              aria-label={`Branch for ${user?.name}`}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                            >
                              <option value="">All branches</option>
                              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          ) : branchName(emp.branchId)}
                        </TableCell>
                        {canManage && <TableCell>{emp.salary ? formatCurrency(emp.salary) : "-"}</TableCell>}
                        <TableCell>
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge variant={emp.approval === "rejected" ? "danger" : emp.isActive ? "success" : "default"}>{emp.approval === "rejected" ? "Declined" : emp.isActive ? "Active" : "Off"}</Badge>
                            {canManage && !self && emp.approval !== "rejected" && !isOwner && (
                              <>
                                <button onClick={() => run(`active-${emp.id}`, () => staffApi.setActive(emp.id, !emp.isActive), [emp.isActive ? "Account switched off" : "Account switched on", user?.name])} className="text-xs text-blue-600 hover:underline">{emp.isActive ? "Deactivate" : "Activate"}</button>
                                <button onClick={() => setEditing(emp)} className="text-xs text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => setRemoving(emp)} className="text-xs text-red-600 hover:underline">Remove</button>
                              </>
                            )}
                            {canManage && emp.approval === "rejected" && <button onClick={() => setRemoving(emp)} className="text-xs text-red-600 hover:underline">Remove</button>}
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">What each role can do</h3><p className="text-xs text-gray-500">Refunds, price changes and stock edits are limited to the right people. Cashiers can ask a manager to approve with a PIN.</p></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table scroll>
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

      {approving && (
        <ApproveDialog
          employee={approving}
          name={userOf(approving.userId)?.name ?? "this person"}
          onClose={() => setApproving(null)}
          onSubmit={async (input) => {
            const name = userOf(approving.userId)?.name ?? "Staff member"
            if (await run(`approve-${approving.id}`, () => staffApi.approve(approving.id, input), ["Staff approved", `${name} is now ${ROLE_LABELS[input.role]} and can sign in`])) setApproving(null)
          }}
        />
      )}

      <Dialog open={!!declining} onClose={() => setDeclining(null)} title="Decline this request?" size="sm">
        <p className="mb-4 text-sm text-gray-600">{userOf(declining?.userId ?? "")?.name} will not be able to sign in.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeclining(null)}>Cancel</Button>
          <Button isLoading={busy === `decline-${declining?.id}`} onClick={async () => { if (declining && await run(`decline-${declining.id}`, () => staffApi.decline(declining.id), ["Request declined", userOf(declining.userId)?.name])) setDeclining(null) }}>Decline</Button>
        </div>
      </Dialog>

      <Dialog open={!!removing} onClose={() => setRemoving(null)} title="Remove this person?" size="sm">
        <p className="mb-4 text-sm text-gray-600">{userOf(removing?.userId ?? "")?.name} will lose access. Their past sales stay on record.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button variant="danger" isLoading={busy === `remove-${removing?.id}`} onClick={async () => { if (removing && await run(`remove-${removing.id}`, () => staffApi.remove(removing.id), ["Staff removed", userOf(removing.userId)?.name])) setRemoving(null) }}>Remove</Button>
        </div>
      </Dialog>

      {editing && <EditDialog employee={editing} name={userOf(editing.userId)?.name ?? ""} phone={userOf(editing.userId)?.phone ?? ""} onClose={() => setEditing(null)} onSubmit={async (body) => { if (await run(`edit-${editing.id}`, () => staffApi.edit(editing.id, body), ["Staff updated"])) setEditing(null) }} />}
      {adding && <AddDialog onClose={() => setAdding(false)} onSubmit={async (body) => { if (await run("add", () => staffApi.create(body), ["Staff member added", `An invite link was emailed to ${body.email}`])) setAdding(false) }} />}
    </div>
  )
}

function BranchSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const branches = useDataStore((s) => s.branches)
  return <Select label="Branch (optional)" placeholder="All branches" options={branches.map((b) => ({ value: b.id, label: b.name }))} value={value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} />
}

function ApproveDialog({ employee, name, onClose, onSubmit }: { employee: Employee; name: string; onClose: () => void; onSubmit: (v: { role: AssignableRole; branchId?: string; salary?: number }) => Promise<void> }) {
  const [role, setRole] = useState<AssignableRole>("cashier")
  const [branchId, setBranchId] = useState(employee.branchId ?? "")
  const [salary, setSalary] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pay = salary.trim() === "" ? undefined : Number(salary)
    if (pay !== undefined && (!Number.isFinite(pay) || pay < 0)) return setError("Salary must be a positive number.")
    setSaving(true)
    await onSubmit({ role, branchId: branchId || undefined, salary: pay })
    setSaving(false)
  }
  return (
    <Dialog open onClose={onClose} title={`Approve ${name}`} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Select label="Role" options={assignableRoles(useDataStore.getState().industry).map((r) => ({ value: r.role, label: r.label }))} value={role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as AssignableRole)} autoFocus />
        <p className="-mt-2 text-xs text-gray-500">{ROLE_DESCRIPTIONS[role]}</p>
        <BranchSelect value={branchId} onChange={setBranchId} />
        <Input label="Monthly salary (KES, optional)" type="number" min="0" step={100} value={salary} onChange={(e) => setSalary(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={saving}>Approve</Button></div>
      </form>
    </Dialog>
  )
}

function EditDialog({ employee, name, phone, onClose, onSubmit }: { employee: Employee; name: string; phone: string; onClose: () => void; onSubmit: (v: { name: string; phone: string | null; salary: number | null }) => Promise<void> }) {
  const [form, setForm] = useState({ name, phone, salary: employee.salary ? String(employee.salary) : "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2 || form.name.trim().length > 100) return setError("Name must be 2 to 100 characters.")
    const pay = form.salary.trim() === "" ? null : Number(form.salary)
    if (pay !== null && (!Number.isFinite(pay) || pay < 0)) return setError("Salary must be a positive number.")
    setSaving(true)
    await onSubmit({ name: form.name.trim(), phone: form.phone.trim() || null, salary: pay })
    setSaving(false)
  }
  return (
    <Dialog open onClose={onClose} title="Edit staff member" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Monthly salary (KES)" type="number" min="0" step={100} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={saving}>Save</Button></div>
      </form>
    </Dialog>
  )
}

function AddDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: { name: string; email: string; phone?: string; role: AssignableRole; branchId?: string; salary?: number }) => Promise<void> }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "cashier" as AssignableRole, branchId: "", salary: "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    if (name.length < 2 || name.length > 100) return setError("Name must be 2 to 100 characters.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.")
    const pay = form.salary.trim() === "" ? undefined : Number(form.salary)
    if (pay !== undefined && (!Number.isFinite(pay) || pay < 0)) return setError("Salary must be a positive number.")
    setError("")
    setSaving(true)
    try {
      await onSubmit({ name, email, phone: form.phone.trim() || undefined, role: form.role, branchId: form.branchId || undefined, salary: pay })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add that person.")
    }
    setSaving(false)
  }
  return (
    <Dialog open onClose={onClose} title="Add staff member" size="md">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-500">They get an email with a link to choose their own password.</p>
        <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
        <Input label="Email (used to sign in)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0712 345 678" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Role" options={assignableRoles(useDataStore.getState().industry).map((r) => ({ value: r.role, label: r.label }))} value={form.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, role: e.target.value as AssignableRole })} />
          <BranchSelect value={form.branchId} onChange={(v) => setForm({ ...form, branchId: v })} />
        </div>
        <Input label="Monthly salary (KES, optional)" type="number" min="0" step={100} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
        <p className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[form.role]}</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={saving}>Add staff</Button></div>
      </form>
    </Dialog>
  )
}
