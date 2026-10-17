import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { isOffline } from "@/lib/stores/pos-store"
import { getBranchStock } from "@/lib/utils/stock"
import { generateId } from "@/lib/utils/generators"
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
  discountTotal: number
  couponCode?: string
  loyaltyRedeemed?: number
  notes?: string
  approvedBy?: string
  /** Same key = same sale: a double click or a retry after a timeout can never record two sales. */
  idempotencyKey: string
  /** Cash handed over by the customer, used to work out change. */
  cashTendered?: number
}

const round = (n: number) => Math.round(n * 100) / 100

export function priceLines(lines: CheckoutInput["lines"], discountTotal: number) {
  const subtotal = round(lines.reduce((s, l) => s + l.product.sellingPrice * l.quantity, 0))
  const rawTax = lines.reduce((s, l) => s + (l.product.sellingPrice * l.quantity * l.product.taxRate) / 100, 0)
  const discount = Math.min(discountTotal, subtotal)
  const taxTotal = round(subtotal > 0 ? rawTax * (1 - discount / subtotal) : 0)
  return { subtotal, taxTotal, discountTotal: round(discount), total: round(subtotal + taxTotal - discount) }
}

export function completeSale(input: CheckoutInput): Sale {
  const data = useDataStore.getState()
  const user = useAuthStore.getState().user

  const existing = data.sales.find((s) => s.idempotencyKey === input.idempotencyKey)
  if (existing) return existing

  if (input.lines.length === 0) throw new Error("The order is empty.")
  for (const line of input.lines) {
    const live = data.products.find((p) => p.id === line.product.id)
    const branchIds = data.branches.map((b) => b.id)
    const here = user?.branchId ?? branchIds[0] ?? ""
    if (!live || line.quantity > getBranchStock(live, here, branchIds)) throw new Error(`Not enough stock for ${line.product.name}.`)
  }

  const { subtotal, taxTotal, discountTotal, total } = priceLines(input.lines, input.discountTotal)
  const customer = data.customers.find((c) => c.id === input.customerId)
  const collected = round(input.payments.reduce((s, p) => s + p.amount, 0))
  const amountDue = round(Math.max(0, total - collected))
  if (amountDue > 0) {
    if (!customer) throw new Error("Only a customer with a credit account can leave a balance.")
    const limit = customer.creditLimit ?? 0
    if ((customer.amountOwed ?? 0) + amountDue > limit) {
      throw new Error(`This would exceed ${customer.name}'s credit limit of KES ${limit.toLocaleString()}.`)
    }
  }

  const now = new Date()
  const saleId = generateId()
  const shift = data.shiftRecords.find((r) => r.userId === user?.id && !r.closedAt)
  const seq = data.sales.length + 1
  const cashPaid = input.payments.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0)
  const change = input.cashTendered ? round(Math.max(0, input.cashTendered - cashPaid)) : 0
  const biggest = [...input.payments].sort((a, b) => b.amount - a.amount)[0]
  const primary: PaymentMethod = biggest ? biggest.method : "credit"
  const earned = customer ? Math.floor(total / 100) : 0
  const offline = isOffline()
  const stamp = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`

  const sale: Sale = {
    id: saleId,
    businessId: user?.businessId ?? "",
    branchId: user?.branchId ?? "",
    customerId: customer?.id,
    userId: user?.id ?? "",
    orderNumber: `ORD-${10000 + seq}`,
    receiptNumber: `RCP-${stamp}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    idempotencyKey: input.idempotencyKey,
    status: "completed",
    subtotal,
    taxTotal,
    discountTotal,
    total,
    paidAmount: collected,
    changeAmount: change,
    amountDue: amountDue > 0 ? amountDue : undefined,
    dueDate: amountDue > 0 ? new Date(now.getTime() + 14 * 86400000).toISOString() : undefined,
    paymentMethod: primary,
    reference: input.payments.find((p) => p.reference)?.reference,
    shiftId: shift?.id,
    notes: input.notes,
    couponCode: input.couponCode || undefined,
    approvedBy: input.approvedBy,
    loyaltyEarned: earned || undefined,
    loyaltyRedeemed: input.loyaltyRedeemed || undefined,
    synced: !offline,
    items: input.lines.map((l) => {
      const base = l.product.sellingPrice * l.quantity
      const share = base / (subtotal || 1)
      const tax = ((base * l.product.taxRate) / 100) * (1 - discountTotal / (subtotal || 1))
      return {
        id: generateId(),
        saleId,
        productId: l.product.id,
        quantity: l.quantity,
        unitPrice: l.product.sellingPrice,
        unitCost: l.product.costPrice,
        discount: round(discountTotal * share),
        tax: round(tax),
        total: round(base - discountTotal * share + tax),
      }
    }),
    payments: input.payments.map((p) => ({
      id: generateId(),
      saleId,
      method: p.method,
      amount: p.amount,
      reference: p.reference,
      status: "completed" as const,
      createdAt: now.toISOString(),
    })),
    createdAt: now.toISOString(),
  }

  data.addSale(sale)
  input.lines.forEach((l) => data.adjustStock(l.product.id, -l.quantity, undefined, undefined, sale.branchId || undefined))
  if (customer) {
    data.updateCustomer(customer.id, {
      loyaltyPoints: Math.max(0, customer.loyaltyPoints - (input.loyaltyRedeemed ?? 0) + earned),
      amountOwed: round((customer.amountOwed ?? 0) + amountDue),
      creditDueDate: amountDue > 0 ? sale.dueDate : customer.creditDueDate,
    })
  }
  const pct = subtotal > 0 ? (discountTotal / subtotal) * 100 : 0
  if (discountTotal > 0) {
    data.logAudit(
      "Discount applied",
      "Sale",
      `${sale.receiptNumber}: KES ${discountTotal.toLocaleString()} off (${pct.toFixed(0)}%)${input.approvedBy ? `, approved by ${input.approvedBy}` : ""}`,
      pct >= 20 ? "warning" : "info"
    )
  }
  if (amountDue > 0) data.logAudit("Credit sale", "Sale", `${sale.receiptNumber}: KES ${amountDue.toLocaleString()} on ${customer?.name}'s account`)
  notify.success(`Sale ${sale.receiptNumber} complete`, `KES ${total.toLocaleString()}${amountDue > 0 ? ` · KES ${amountDue.toLocaleString()} on account` : ""}`)
  if (offline) notify.warning("Saved offline", "This sale will sync when you reconnect.")
  if (offline) data.logAudit("Offline sale", "Sale", `${sale.receiptNumber} saved on this device, waiting to sync`)
  return sale
}

export function refundSale(saleId: string, kind: "refund" | "void", reason: string, approvedBy?: string) {
  const data = useDataStore.getState()
  const sale = data.sales.find((s) => s.id === saleId)
  if (!sale || sale.status !== "completed") throw new Error("Only completed sales can be refunded or voided.")
  const user = useAuthStore.getState().user

  data.updateSale(
    saleId,
    kind === "refund" ? { status: "refunded", refundReason: reason, approvedBy } : { status: "cancelled", voidReason: reason, approvedBy }
  )
  sale.items?.forEach((i) => data.adjustStock(i.productId, i.quantity, undefined, undefined, sale.branchId || undefined))

  const customer = data.customers.find((c) => c.id === sale.customerId)
  if (customer) {
    data.updateCustomer(customer.id, {
      amountOwed: Math.max(0, (customer.amountOwed ?? 0) - (sale.amountDue ?? 0)),
      loyaltyPoints: Math.max(0, customer.loyaltyPoints - (sale.loyaltyEarned ?? 0) + (sale.loyaltyRedeemed ?? 0)),
    })
  }
  notify.success(kind === "refund" ? "Refund recorded" : "Sale voided", `${sale.receiptNumber ?? sale.orderNumber} · stock returned`)
  const risky = user?.role === "cashier" || sale.total >= 5000
  data.logAudit(
    kind === "refund" ? "Refund issued" : "Sale voided",
    "Sale",
    `${sale.receiptNumber ?? sale.orderNumber} (KES ${sale.total.toLocaleString()}) — ${reason}${approvedBy ? `, approved by ${approvedBy}` : ""}`,
    risky ? "warning" : "info"
  )
}

export function syncPendingSales(): number {
  const data = useDataStore.getState()
  const pending = data.sales.filter((s) => s.synced === false)
  pending.forEach((s) => data.updateSale(s.id, { synced: true }))
  if (pending.length) notify.success("Back online", `${pending.length} offline sale(s) synced`)
  if (pending.length) data.logAudit("Offline sales synced", "System", `${pending.length} sale(s) uploaded after reconnecting`)
  return pending.length
}
