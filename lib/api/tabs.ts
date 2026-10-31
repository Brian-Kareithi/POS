import { api } from "@/lib/api/client"
import { toSale } from "@/lib/api/mappers"
import type { PaymentInput } from "@/lib/services/checkout"
import type { Sale } from "@/lib/types"

export interface TabLine {
  id: string
  productId: string
  variantId: string | null
  name: string
  quantity: number
  unitPrice: number
  total: number
  /** switched off or deleted since it was added: it has to come off before the tab can be paid */
  unavailable: boolean
  addedBy: string | null
  updatedAt: string
}

export interface Tab {
  id: string
  label: string
  status: "open" | "closed" | "cancelled"
  branchId: string
  openedBy: string
  openedByName: string | null
  customerId: string | null
  notes: string | null
  version: number
  saleId: string | null
  closedAt: string | null
  createdAt: string
  /** path of the read-only guest page, e.g. /t/abc123 */
  sharePath: string
  shareUrl: string
  /** a guest is paying from their phone right now, so the tab cannot be edited */
  guestPaying: boolean
  lines: TabLine[]
  subtotal: number
  taxTotal: number
  total: number
  itemCount: number
}

export interface TabPage { data: Tab[]; meta: { page: number; limit: number; total: number; pages: number } }

export interface Line { productId: string; variantId?: string | null; quantity: number }

/** The link a guest scans. Built from the page the staff are on, so it always points at this deployment. */
export const guestUrl = (tab: Pick<Tab, "sharePath">) => (typeof window === "undefined" ? tab.sharePath : `${window.location.origin}${tab.sharePath}`)

export const tabs = {
  list: (status: Tab["status"] = "open") => api<TabPage>("/tabs", { query: { status, limit: 100 } }),
  get: (id: string) => api<Tab>(`/tabs/${id}`),
  open: (body: { label: string; customerId?: string | null; notes?: string; lines?: Line[] }) => api<Tab>("/tabs", { method: "POST", body }),
  rename: (id: string, body: { label?: string; customerId?: string | null; notes?: string | null }) => api<Tab>(`/tabs/${id}`, { method: "PATCH", body }),
  add: (id: string, lines: Line[]) => api<Tab>(`/tabs/${id}/items`, { method: "POST", body: { lines } }),
  setQuantity: (id: string, itemId: string, quantity: number, approvalToken?: string) =>
    api<Tab>(`/tabs/${id}/items/${itemId}`, { method: "PATCH", body: { quantity, ...(approvalToken ? { approvalToken } : {}) } }),
  close: async (id: string, body: { payments: PaymentInput[]; cashTendered?: number; customerId?: string; notes?: string }): Promise<Sale> =>
    toSale(await api(`/tabs/${id}/close`, { method: "POST", body })),
  cancel: (id: string, reason: string, approvalToken?: string) => api<Tab>(`/tabs/${id}/cancel`, { method: "POST", body: { reason, ...(approvalToken ? { approvalToken } : {}) } }),
  rotateLink: (id: string) => api<Tab>(`/tabs/${id}/rotate-link`, { method: "POST" }),
}

// ---------------------------------------------------------------- the guest's page (no sign-in)

export interface GuestTab {
  status: "open" | "closed" | "cancelled"
  label: string
  openedAt: string
  serverTime: string
  business: { name: string; address: string | null; phone: string | null; currency: string; logo: string | null }
  branch: string | null
  footerText: string | null
  kraPin: string | null
  items: { name: string; quantity: number; unitPrice: number; total: number }[]
  subtotal: number
  taxTotal: number
  total: number
  canPay: boolean
  payment: { status: "pending" | "completed" | "failed" | "refunded"; message?: string | null } | null
  receipt: null | {
    receiptNumber: string
    orderNumber: string
    paidAt: string
    paymentMethod: string
    subtotal: number
    taxTotal: number
    discountTotal: number
    total: number
    paidAmount: number
    changeAmount: number
    items: { name: string; quantity: number; unitPrice: number; total: number }[]
  }
}

export const guestTab = {
  get: (token: string) => api<GuestTab>(`/public/tabs/${encodeURIComponent(token)}`, { public: true }),
  pay: (token: string, phone: string) => api<{ message: string }>(`/public/tabs/${encodeURIComponent(token)}/pay`, { method: "POST", public: true, body: { phone } }),
  call: (token: string, reason: "bill" | "waiter") => api<{ message: string }>(`/public/tabs/${encodeURIComponent(token)}/call`, { method: "POST", public: true, body: { reason } }),
}
