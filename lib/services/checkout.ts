import { api, ApiError } from "@/lib/api/client"
import { toSale } from "@/lib/api/mappers"
import { refresh } from "@/lib/api/sync"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { isOffline, usePosStore } from "@/lib/stores/pos-store"
import { getBranchStock } from "@/lib/utils/stock"
import { notify } from "@/lib/toast"
import type { PaymentMethod, Product, Sale } from "@/lib/types"

export interface PaymentInput {
  method: PaymentMethod
  amount: number
  reference?: string
}

export interface CheckoutInput {
  lines: { product: Product; quantity: number }[]
  payments: PaymentInput[]
  customerId?: string
  /** Manual discount; promotion and coupon discounts are worked out by the server from `couponCode`. */
  manualDiscount?: { kind: "percent" | "amount"; value: number }
  couponCode?: string
  loyaltyRedeemed?: number
  notes?: string
  /** Single-use manager approval token (for cashier discounts above the limit). */
  approvalToken?: string
  /** Name of the approving manager, kept only for the local offline receipt. */
  approvedBy?: string
  /** Estimated discount, used only to draw an offline receipt; the server recomputes everything. */
  estimatedDiscount?: number
  /** Same key = same sale: a double click or a retry after a timeout can never record two sales. */
  idempotencyKey: string
  /** Cash handed over by the customer, used to work out change. */
  cashTendered?: number
  /** The branch the sale is rung up at. Owners and managers have no fixed branch, so they must say. */
  branchId?: string
}

const round = (n: number) => Math.round(n * 100) / 100

/** On-screen estimate only. The server prices every sale from its own database when the sale is saved. */
export function priceLines(lines: { product: Product; quantity: number }[], discountTotal: number) {
  const subtotal = round(lines.reduce((s, l) => s + l.product.sellingPrice * l.quantity, 0))
  const rawTax = lines.reduce((s, l) => s + (l.product.sellingPrice * l.quantity * l.product.taxRate) / 100, 0)
  const discount = Math.min(discountTotal, subtotal)
  const taxTotal = round(subtotal > 0 ? rawTax * (1 - discount / subtotal) : 0)
  return { subtotal, taxTotal, discountTotal: round(discount), total: round(subtotal + taxTotal - discount) }
}

/** Only real methods go to the server; whatever is not paid becomes a credit sale there. */
function requestBody(input: CheckoutInput) {
  return {
    lines: input.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    payments: input.payments.filter((p) => p.method !== "credit").map((p) => ({ method: p.method, amount: p.amount, ...(p.reference ? { reference: p.reference } : {}) })),
    ...(input.customerId ? { customerId: input.customerId } : {}),
    ...(input.branchId ? { branchId: input.branchId } : {}),
    ...(input.couponCode ? { couponCode: input.couponCode } : {}),
    ...(input.manualDiscount && input.manualDiscount.value > 0 ? { manualDiscount: input.manualDiscount } : {}),
    ...(input.loyaltyRedeemed ? { loyaltyRedeemed: input.loyaltyRedeemed } : {}),
    ...(input.cashTendered ? { cashTendered: input.cashTendered } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
    ...(input.approvalToken ? { approvalToken: input.approvalToken } : {}),
  }
}

function checkStockLocally(input: CheckoutInput) {
  const data = useDataStore.getState()
  const user = useAuthStore.getState().user
  const branchIds = data.branches.map((b) => b.id)
  const here = user?.branchId ?? branchIds[0] ?? ""
  for (const line of input.lines) {
    const live = data.products.find((p) => p.id === line.product.id)
    if (!live || line.quantity > getBranchStock(live, here, branchIds)) throw new Error(`Not enough stock for ${line.product.name}.`)
  }
}

/** Builds a receipt for a sale that could not reach the server. Numbers are estimates until it syncs. */
function provisionalSale(input: CheckoutInput): Sale {
  const user = useAuthStore.getState().user
  const { subtotal, taxTotal, discountTotal, total } = priceLines(input.lines, input.estimatedDiscount ?? 0)
  const paid = round(input.payments.reduce((s, p) => s + p.amount, 0))
  const cashPaid = input.payments.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0)
  const biggest = [...input.payments].sort((a, b) => b.amount - a.amount)[0]
  const now = new Date().toISOString()
  return {
    id: `offline-${input.idempotencyKey}`, businessId: user?.businessId ?? "", branchId: user?.branchId ?? "", customerId: input.customerId,
    userId: user?.id ?? "", orderNumber: "Pending sync", receiptNumber: "Pending sync", idempotencyKey: input.idempotencyKey, status: "completed",
    subtotal, taxTotal, discountTotal, total, paidAmount: paid, changeAmount: input.cashTendered ? round(Math.max(0, input.cashTendered - cashPaid)) : 0,
    amountDue: paid < total ? round(total - paid) : undefined, paymentMethod: biggest ? biggest.method : "credit",
    approvedBy: input.approvedBy, synced: false,
    items: input.lines.map((l, i) => ({
      id: `offline-${i}`, saleId: "", productId: l.product.id, name: l.product.name, quantity: l.quantity, unitPrice: l.product.sellingPrice,
      discount: 0, tax: round((l.product.sellingPrice * l.quantity * l.product.taxRate) / 100), total: round(l.product.sellingPrice * l.quantity),
    })),
    payments: input.payments.map((p, i) => ({ id: `offline-p${i}`, saleId: "", method: p.method, amount: p.amount, reference: p.reference, status: "completed" as const, createdAt: now })),
    createdAt: now,
  }
}

function queueOffline(input: CheckoutInput): Sale {
  checkStockLocally(input)
  const sale = provisionalSale(input)
  usePosStore.getState().enqueue({ idempotencyKey: input.idempotencyKey, occurredAt: sale.createdAt, payload: requestBody(input) })
  return sale
}

export async function completeSale(input: CheckoutInput): Promise<Sale> {
  if (input.lines.length === 0) throw new Error("The order is empty.")
  const existing = useDataStore.getState().sales.find((s) => s.idempotencyKey === input.idempotencyKey)
  if (existing) return existing

  if (isOffline()) {
    const sale = queueOffline(input)
    notify.warning("Saved offline", "This sale will sync when you reconnect.")
    return sale
  }

  try {
    const sale = toSale(await api("/sales", { method: "POST", body: requestBody(input), idempotencyKey: input.idempotencyKey }))
    useDataStore.getState().upsert("sales", sale, true)
    await Promise.allSettled([refresh.products(), input.customerId ? refresh.customer(input.customerId) : Promise.resolve()])
    notify.success(`Sale ${sale.receiptNumber} complete`, `KES ${sale.total.toLocaleString()}${sale.amountDue ? ` · KES ${sale.amountDue.toLocaleString()} on account` : ""}`)
    return sale
  } catch (e) {
    // Lost connection mid-request: keep the sale so it is not lost. The same idempotency key makes the upload safe to repeat.
    if (e instanceof ApiError && e.status === 0) {
      const sale = queueOffline(input)
      notify.warning("Saved offline", "The server could not be reached. This sale will sync when you reconnect.")
      return sale
    }
    throw e
  }
}

export async function refundSale(saleId: string, kind: "refund" | "void", reason: string, approvalToken?: string) {
  const sale = toSale(await api(`/sales/${saleId}/${kind}`, { method: "POST", body: { reason, ...(approvalToken ? { approvalToken } : {}) } }))
  useDataStore.getState().upsert("sales", sale)
  await Promise.allSettled([refresh.products(), sale.customerId ? refresh.customer(sale.customerId) : Promise.resolve()])
  notify.success(kind === "refund" ? "Refund recorded" : "Sale voided", `${sale.receiptNumber ?? sale.orderNumber} · stock returned`)
  return sale
}

let syncing = false

/** Uploads sales queued while offline. Returns how many were saved. */
export async function syncPendingSales(): Promise<number> {
  const pos = usePosStore.getState()
  if (syncing || pos.queue.length === 0 || isOffline()) return 0
  syncing = true
  try {
    const res = await api<{ results: { idempotencyKey: string; status: string; error?: { message: string } }[] }>("/sales/sync", {
      method: "POST",
      body: { sales: pos.queue.map((q) => ({ ...q.payload, idempotencyKey: q.idempotencyKey, occurredAt: q.occurredAt })) },
    })
    const done = res.results.filter((r) => r.status === "created" || r.status === "duplicate").length
    // Rejected sales (for example, stock ran out elsewhere) are dropped from the queue and reported, never retried forever.
    const rejected = res.results.filter((r) => r.status !== "created" && r.status !== "duplicate")
    usePosStore.getState().dequeue(res.results.map((r) => r.idempotencyKey))
    await Promise.allSettled([refresh.sales(), refresh.products()])
    if (done) notify.success("Back online", `${done} offline sale(s) synced`)
    rejected.forEach((r) => notify.error("An offline sale was rejected", r.error?.message))
    return done
  } catch {
    return 0
  } finally {
    syncing = false
  }
}
