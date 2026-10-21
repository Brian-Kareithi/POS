import type { Product, Sale, Transaction } from "@/lib/types"

export type Period = "today" | "week" | "month" | "year"

export interface Range {
  start: Date
  end: Date
}

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

/** Current range and the comparable previous range for a period. */
export function periodRanges(period: Period, now = new Date()): { current: Range; previous: Range; label: string; previousLabel: string } {
  const sod = startOfDay(now)
  switch (period) {
    case "today":
      return { current: { start: sod, end: now }, previous: { start: addDays(sod, -1), end: addDays(now, -1) }, label: "Today", previousLabel: "yesterday" }
    case "week":
      return { current: { start: addDays(sod, -6), end: now }, previous: { start: addDays(sod, -13), end: addDays(now, -7) }, label: "Last 7 days", previousLabel: "previous 7 days" }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevEnd = new Date(Math.min(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime(), new Date(prevStart.getFullYear(), prevStart.getMonth(), now.getDate(), 23, 59, 59).getTime()))
      return { current: { start, end: now }, previous: { start: prevStart, end: prevEnd }, label: "This month", previousLabel: "last month" }
    }
    default:
      return {
        current: { start: new Date(now.getFullYear(), 0, 1), end: now },
        previous: { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 23, 59, 59) },
        label: "This year", previousLabel: "same period last year",
      }
  }
}

export const inRange = (iso: string, range: Range) => {
  const t = new Date(iso).getTime()
  return t >= range.start.getTime() && t <= range.end.getTime()
}

export const salesIn = (sales: Sale[], range: Range) => sales.filter((s) => inRange(s.createdAt, range))
export const txIn = (txs: Transaction[], range: Range) => txs.filter((t) => inRange(t.date, range))

/** The share of a sale that was kept: 1 for an ordinary sale, less once part of it has been refunded. */
const kept = (sale: Sale) => (sale.total > 0 && sale.refundedAmount ? Math.max(0, 1 - sale.refundedAmount / sale.total) : 1)

const costOf = (sale: Sale, products: Map<string, Product>) =>
  (sale.items ?? []).reduce((sum, i) => sum + (i.quantity - (i.refundedQty ?? 0)) * (i.unitCost ?? products.get(i.productId)?.costPrice ?? 0), 0)

export interface Summary {
  transactions: number
  gross: number
  discounts: number
  refunds: number
  net: number
  taxes: number
  cogs: number
  grossProfit: number
  margin: number
  collected: number
  outstanding: number
}

/** Gross sales, net sales, COGS and gross profit for a list of sales (tax is reported separately, never counted as revenue). */
export function summarize(sales: Sale[], products: Product[]): Summary {
  const byId = new Map(products.map((p) => [p.id, p]))
  const completed = sales.filter((s) => s.status === "completed")
  const refunded = sales.filter((s) => s.status === "refunded")
  const gross = completed.reduce((s, x) => s + x.subtotal * kept(x), 0)
  const discounts = completed.reduce((s, x) => s + x.discountTotal * kept(x), 0)
  const refunds = refunded.reduce((s, x) => s + (x.subtotal - x.discountTotal), 0) + completed.reduce((s, x) => s + (x.subtotal - x.discountTotal) * (1 - kept(x)), 0)
  const cogs = completed.reduce((s, x) => s + costOf(x, byId), 0)
  const net = gross - discounts
  const grossProfit = net - cogs
  return {
    transactions: completed.length,
    gross, discounts, refunds, net,
    taxes: completed.reduce((s, x) => s + x.taxTotal * kept(x), 0),
    cogs, grossProfit,
    margin: net > 0 ? (grossProfit / net) * 100 : 0,
    collected: completed.reduce((s, x) => s + x.paidAmount, 0),
    outstanding: completed.reduce((s, x) => s + (x.amountDue ?? 0), 0),
  }
}

export const expensesTotal = (txs: Transaction[]) => txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

export function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export function paymentBreakdown(sales: Sale[]): { method: string; amount: number }[] {
  const totals = new Map<string, number>()
  sales.filter((s) => s.status === "completed").forEach((s) => {
    ;(s.payments ?? []).forEach((p) => totals.set(p.method, (totals.get(p.method) ?? 0) + p.amount))
    if (s.amountDue) totals.set("credit", (totals.get("credit") ?? 0) + s.amountDue)
  })
  return [...totals.entries()].map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount)
}

export interface ProductStat {
  product: Product
  quantity: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

export function productStats(sales: Sale[], products: Product[]): ProductStat[] {
  const map = new Map<string, ProductStat>()
  products.forEach((product) => map.set(product.id, { product, quantity: 0, revenue: 0, cost: 0, profit: 0, margin: 0 }))
  sales.filter((s) => s.status === "completed").forEach((sale) => {
    ;(sale.items ?? []).forEach((i) => {
      const stat = map.get(i.productId)
      if (!stat) return
      stat.quantity += i.quantity
      stat.revenue += i.unitPrice * i.quantity
      stat.cost += (i.unitCost ?? stat.product.costPrice) * i.quantity
    })
  })
  return [...map.values()].map((s) => ({ ...s, profit: s.revenue - s.cost, margin: s.revenue > 0 ? ((s.revenue - s.cost) / s.revenue) * 100 : 0 }))
}

export function dailySeries(sales: Sale[], txs: Transaction[], days: number, now = new Date()) {
  const out: { date: string; label: string; sales: number; expenses: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = startOfDay(addDays(now, -i))
    const end = new Date(day.getTime() + 86400000 - 1)
    const range = { start: day, end }
    out.push({
      date: day.toISOString(),
      label: day.toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
      sales: Math.round(summarize(salesIn(sales, range), []).net),
      expenses: Math.round(expensesTotal(txIn(txs, range))),
    })
  }
  return out
}

export const toRange = (from: string, to: string): Range => ({
  start: new Date(from + "T00:00:00"),
  end: new Date(to + "T23:59:59"),
})

export const isoDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Cash a till should hold: opening float plus cash taken by this person during the shift, minus cash refunded. */
export function expectedCash(shift: { userId: string; openedAt: string; closedAt?: string; openingCash: number }, sales: Sale[]): number {
  const from = new Date(shift.openedAt).getTime()
  const to = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now()
  const cash = sales
    .filter((s) => s.userId === shift.userId && new Date(s.createdAt).getTime() >= from && new Date(s.createdAt).getTime() <= to)
    .reduce((sum, s) => {
      const c = (s.payments ?? []).filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0)
      return s.status === "completed" ? sum + c : sum
    }, 0)
  return Math.round(shift.openingCash + cash)
}
