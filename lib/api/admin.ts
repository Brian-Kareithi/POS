import { api, type Page } from "@/lib/api/client"
import type { Industry, ModuleId, Role } from "@/lib/types"

export type BusinessStatus = "active" | "suspended" | "closed"

export interface AdminOverview {
  businesses: { total: number; active: number; suspended: number; closed: number }
  users: number
  newBusinesses: { last7Days: number; last30Days: number }
  businessesActiveLast7Days: number
  byIndustry: { industry: Industry; label: string; count: number }[]
}

export interface AdminBusinessRow {
  id: string
  name: string
  slug: string
  industry: Industry
  industryLabel: string
  status: BusinessStatus
  statusReason: string | null
  createdAt: string
  owner: { name: string; email: string; phone: string | null } | null
  staffCount: number
  lastActiveAt: string | null
}

export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
  emailVerified: boolean
  twoFactorEnabled: boolean
  isActive: boolean
  approval: "pending" | "approved" | "rejected" | null
  lastLoginAt: string | null
  createdAt: string
}

export interface AdminBusinessDetail {
  business: {
    id: string; name: string; slug: string; email: string | null; phone: string | null; address: string | null
    industry: Industry; industryLabel: string; currency: string; timezone: string
    status: BusinessStatus; statusReason: string | null; statusChangedAt: string | null; createdAt: string
    hiddenModules: ModuleId[]
    features: { id: ModuleId; label: string; locked: boolean; hidden: boolean }[]
  }
  usage: { staff: number; branches: number; products: number; sales: number }
  users: AdminUser[]
  adminActivity: AdminAuditRow[]
}

export interface AdminAuditRow {
  id: string; adminEmail: string; action: string; detail: string; businessId: string | null; userId: string | null; createdAt: string
}

export interface AdminActivityRow {
  id: string; businessId: string; businessName: string; userName: string; role: string; action: string; entity: string; detail: string
  severity: "info" | "warning" | "critical"; createdAt: string
}

export const adminApi = {
  overview: () => api<AdminOverview>("/admin/overview"),
  businesses: (query: { q?: string; status?: string; industry?: string; page?: number; limit?: number }) =>
    api<Page<AdminBusinessRow>>("/admin/businesses", { query }),
  business: (id: string) => api<AdminBusinessDetail>(`/admin/businesses/${id}`),
  setStatus: (id: string, status: BusinessStatus, reason?: string) =>
    api(`/admin/businesses/${id}/status`, { method: "PATCH", body: { status, ...(reason ? { reason } : {}) } }),
  setFeatures: (id: string, hidden: ModuleId[]) => api(`/admin/businesses/${id}/features`, { method: "PATCH", body: { hidden } }),
  /** Permanent. The server insists on the word "delete". */
  erase: (id: string, confirm: string) => api<{ erased: boolean; files: number }>(`/admin/businesses/${id}/erase`, { method: "POST", body: { confirm } }),
  activity: (query: { page?: number; limit?: number; businessId?: string; severity?: string; q?: string }) => api<Page<AdminActivityRow>>("/admin/activity", { query }),
  /** With a password it is set directly; without one, the person is emailed a reset link. */
  resetPassword: (userId: string, password?: string) =>
    api<{ message: string }>(`/admin/users/${userId}/reset-password`, { method: "POST", body: password ? { password } : {} }),
  revoke: (userId: string, reason?: string) => api(`/admin/users/${userId}/revoke`, { method: "POST", body: reason ? { reason } : {} }),
  restore: (userId: string) => api(`/admin/users/${userId}/restore`, { method: "POST", body: {} }),
  signOut: (userId: string) => api(`/admin/users/${userId}/sign-out`, { method: "POST", body: {} }),
  resetTwoFactor: (userId: string) => api(`/admin/users/${userId}/two-factor/reset`, { method: "POST", body: {} }),
  audit: (query: { page?: number; limit?: number; businessId?: string }) => api<Page<AdminAuditRow>>("/admin/audit", { query }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>("/admin/password", { method: "POST", body: { currentPassword, newPassword } }),
}

export const STATUS_LABELS: Record<BusinessStatus, string> = { active: "Active", suspended: "Suspended", closed: "Closed" }
export const STATUS_VARIANT = { active: "success", suspended: "warning", closed: "danger" } as const

export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Never"
