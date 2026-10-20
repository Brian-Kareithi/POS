import { api } from "@/lib/api/client"
import { refresh } from "@/lib/api/sync"
import type { Role } from "@/lib/types"

export type AssignableRole = Exclude<Role, "owner">

/** Roles the server accepts when approving or adding staff. */
export const ASSIGNABLE_ROLES: AssignableRole[] = ["cashier", "manager", "stockkeeper"]

interface ApproveInput { role: AssignableRole; branchId?: string; salary?: number }

const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as T

// Every action re-reads the staff list afterwards so the screen always shows what the server holds.
async function done<T>(p: Promise<T>) {
  const r = await p
  await refresh.staff()
  return r
}

export const staffApi = {
  approve: (id: string, input: ApproveInput) => done(api(`/staff/${id}/approve`, { method: "POST", body: clean(input) })),
  decline: (id: string) => done(api(`/staff/${id}/decline`, { method: "POST" })),
  changeRole: (id: string, role: Role) => done(api(`/staff/${id}/role`, { method: "PATCH", body: { role } })),
  changeBranch: (id: string, branchId: string | null) => done(api(`/staff/${id}/branch`, { method: "PATCH", body: { branchId } })),
  edit: (id: string, body: { name?: string; phone?: string | null; salary?: number | null }) => done(api(`/staff/${id}`, { method: "PATCH", body })),
  setActive: (id: string, active: boolean) => done(api(`/staff/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" })),
  remove: (id: string) => done(api(`/staff/${id}`, { method: "DELETE" })),
  create: (body: { name: string; email: string; phone?: string; role: AssignableRole; branchId?: string; salary?: number }) =>
    done(api("/staff", { method: "POST", body: clean(body) })),
}
