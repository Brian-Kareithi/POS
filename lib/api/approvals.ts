import { api } from "@/lib/api/client"

export interface Approval { approvalToken: string; approver: { id: string; name: string } }

/** Exchanges a manager's personal PIN for a single-use token (valid 5 minutes) that authorises one sale, refund or void. */
export const verifyApprovalPin = (pin: string) => api<Approval>("/approvals/verify", { method: "POST", body: { pin } })
