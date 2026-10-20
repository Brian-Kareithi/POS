import { api } from "@/lib/api/client"

export interface PublicSession {
  token: string
  status: "pending" | "completed" | "expired"
  total: number
  expiresAt: string
  items: { name: string; quantity: number; unitPrice: number; total: number }[]
  payment?: { status: "pending" | "completed" | "failed" | "refunded"; message?: string | null } | null
  receipt?: { receiptNumber: string; total: number } | null
}

/** Self-checkout needs no login. The server prices the cart; the shopper only sees names, quantities and money. */
export const selfCheckout = {
  create: (body: { businessSlug: string; branchId: string; lines: { productId: string; quantity: number }[] }) =>
    api<PublicSession>("/public/checkout/sessions", { method: "POST", public: true, body }),
  get: (token: string) => api<PublicSession>(`/public/checkout/sessions/${encodeURIComponent(token)}`, { public: true }),
  pay: (token: string, phone: string) =>
    api<{ paymentStatus: string; message: string }>(`/public/checkout/sessions/${encodeURIComponent(token)}/pay`, { method: "POST", public: true, body: { phone } }),
}
