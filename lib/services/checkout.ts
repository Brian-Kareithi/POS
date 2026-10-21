import { api, ApiError } from "@/lib/api/client"
import { toSale } from "@/lib/api/mappers"
import { injectQueuedSales, refresh } from "@/lib/api/sync"
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
const shortKey = (key: string) => key.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()
/** A POST that takes longer than this is treated as "no connection": the sale is kept and uploaded later (same key, so never twice). */
const SALE_TIMEOUT_MS = 15_000

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
    userId: user?.id ?? "", orderNumber: `OFFLINE-${shortKey(input.idempotencyKey)}`, receiptNumber: `OFFLINE-${shortKey(input.idempotencyKey)}`, idempotencyKey: input.idempotencyKey, status: "completed",
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

/** Takes the sold units off the local stock count, so several offline sales cannot sell the same shelf twice. */
function deductLocalStock(input: CheckoutInput) {
  const data = useDataStore.getState()
  const user = useAuthStore.getState().user
  const here = user?.branchId ?? input.branchId ?? data.branches[0]?.id ?? ""
  for (const line of input.lines) {
    const live = data.products.find((p) => p.id === line.product.id)
    if (!live) continue
    const branchStock = { ...(live.branchStock ?? {}) }
    if (here in branchStock) branchStock[here] = Math.max(0, branchStock[here] - line.quantity)
    data.patch("products", live.id, { branchStock, stock: Math.max(0, (live.stock ?? 0) - line.quantity) })
  }
}

function queueOffline(input: CheckoutInput): Sale {
  checkStockLocally(input)
  const sale = provisionalSale(input)
  const user = useAuthStore.getState().user
  usePosStore.getState().enqueue({ idempotencyKey: input.idempotencyKey, occurredAt: sale.createdAt, payload: requestBody(input), userId: user?.id, sale, status: "pending" })
  deductLocalStock(input)
  useDataStore.getState().upsert("sales", sale, true)
  return sale
}

export async function completeSale(input: CheckoutInput): Promise<Sale> {
  if (input.lines.length === 0) throw new Error("The order is empty.")
  const existing = useDataStore.getState().sales.find((s) => s.idempotencyKey === input.idempotencyKey)
  if (existing) return existing

  const user = useAuthStore.getState().user
  if (user && useDataStore.getState().shiftRecords.every((shift) => shift.userId !== user.id || !!shift.closedAt)) {
    throw new Error("Open your shift before making a sale.")
  }

  if (isOffline()) {
    const sale = queueOffline(input)
    notify.warning("Saved offline", "This sale will sync when you reconnect.")
    return sale
  }

  try {
    const sale = toSale(await api("/sales", { method: "POST", body: requestBody(input), idempotencyKey: input.idempotencyKey, timeoutMs: SALE_TIMEOUT_MS }))
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
const BATCH = 50

export interface SyncOutcome { saved: number; needsAttention: number; failedToReach: boolean }

/**
 * Uploads sales queued while offline, oldest first, in batches. Each one comes back as:
 *  created / duplicate -> done, removed from the queue
 *  rejected            -> kept and flagged "needs attention" (never silently dropped); a person can retry or discard it
 *  retry / no answer   -> stays in line and is tried again later
 */
export async function syncPendingSales(): Promise<SyncOutcome> {
  const none: SyncOutcome = { saved: 0, needsAttention: 0, failedToReach: false }
  const me = useAuthStore.getState().user
  const waiting = usePosStore.getState().queue
    .filter((q) => (q.status ?? "pending") === "pending" && (!q.userId || q.userId === me?.id))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  if (syncing || waiting.length === 0 || isOffline()) return none
  syncing = true
  const out: SyncOutcome = { ...none }
  try {
    for (let i = 0; i < waiting.length; i += BATCH) {
      const batch = waiting.slice(i, i + BATCH)
      let res: { results: { idempotencyKey: string; status: string; error?: { code?: string; message: string } }[] }
      try {
        res = await api("/sales/sync", {
          method: "POST", timeoutMs: 60_000,
          body: { sales: batch.map((q) => ({ ...q.payload, idempotencyKey: q.idempotencyKey, occurredAt: q.occurredAt })) },
        })
      } catch (e) {
        batch.forEach((q) => usePosStore.getState().markAttempt(q.idempotencyKey, { status: "pending" }))
        if (e instanceof ApiError && e.status === 0) out.failedToReach = true
        break
      }
      for (const r of res.results) {
        if (r.status === "created" || r.status === "duplicate") {
          out.saved += 1
          usePosStore.getState().dequeue([r.idempotencyKey])
        } else if (r.status === "rejected") {
          out.needsAttention += 1
          usePosStore.getState().markAttempt(r.idempotencyKey, { status: "needs_attention", error: r.error ?? { message: "The server did not accept this sale." } })
        } else {
          usePosStore.getState().markAttempt(r.idempotencyKey, { status: "pending", error: r.error })
        }
      }
    }
    if (out.saved || out.needsAttention) await Promise.allSettled([refresh.sales(), refresh.products()])
    injectQueuedSales()
    if (out.saved) notify.success("Back online", `${out.saved} offline sale(s) synced`)
    if (out.needsAttention) notify.error("Some offline sales need attention", "Open the sync panel at the top to retry or review them.")
    return out
  } finally {
    syncing = false
  }
}
