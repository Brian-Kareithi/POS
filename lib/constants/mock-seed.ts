import { generateId } from "../utils/generators"
import type {
  Sale, PurchaseOrder, StockTransfer, Transaction, Notification, PaymentMethod, StockAdjustment,
  AuditLog, ShiftRecord, Promotion, Role,
} from "../types"
import {
  mockBusiness, mockUsers, mockProducts, mockCustomers, mockSuppliers, mockWarehouses, mockBranches, eastleighBranchId,
} from "./mock-data"

// Small deterministic PRNG so the fictional data looks the same on every load.
let seed = 20250917
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)]
const weighted = <T,>(list: T[], weights: number[]): T => {
  let r = rand() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]
    if (r <= 0) return list[i]
  }
  return list[list.length - 1]
}
const at = (days: number, hour: number, minute = Math.floor(rand() * 60)) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d
}
const daysAgo = (days: number, hour = 9) => at(days, hour).toISOString()
const round = (n: number) => Math.round(n * 100) / 100

const mainBranch = mockBranches[0].id
const owner = mockUsers[0]
const manager = mockUsers[1]
const cashierMain = mockUsers[2]
const cashierEast = mockUsers[3]
const stockkeeper = mockUsers[4]

// ---------- Sales (a year of history, growing over time, two branches) ----------
const productWeights = [10, 9, 7, 6, 8, 6, 5, 4, 2, 2, 1, 1]
const methodPool: PaymentMethod[] = ["cash", "cash", "cash", "mobile_money", "mobile_money", "mobile_money", "mobile_money", "card", "card", "bank_transfer"]
const nowHour = new Date().getHours()

export const seedSales: Sale[] = []
let counter = 0
for (let day = 364; day >= 0; day--) {
  const weekday = at(day, 12).getDay()
  const base = 2 + 5 * Math.exp(-day / 120)
  const weekend = weekday === 5 || weekday === 6 ? 1.4 : weekday === 0 ? 0.8 : 1
  const count = Math.max(1, Math.round(base * weekend + rand() * 2 - 0.5))
  for (let n = 0; n < count; n++) {
    const hourCap = day === 0 ? Math.max(8, nowHour) : 20
    const hour = 8 + Math.floor(rand() * (hourCap - 7))
    const createdDate = at(day, Math.min(hour, 20))
    if (day === 0 && createdDate.getTime() > Date.now()) continue
    const createdAt = createdDate.toISOString()
    const saleId = generateId()
    const east = rand() < 0.35
    const branchId = east ? eastleighBranchId : mainBranch
    const seller = east ? cashierEast : rand() < 0.12 ? manager : cashierMain
    const lineCount = 2 + Math.floor(rand() * 5)
    const lines = Array.from({ length: lineCount }, () => {
      const product = weighted(mockProducts, productWeights)
      const quantity = 1 + Math.floor(rand() * 4)
      return { product, quantity, tax: (product.sellingPrice * quantity * product.taxRate) / 100 }
    })
    const subtotal = round(lines.reduce((s, l) => s + l.product.sellingPrice * l.quantity, 0))
    const taxTotal = round(lines.reduce((s, l) => s + l.tax, 0))
    const discountTotal = rand() < 0.12 ? round(subtotal * pick([0.05, 0.05, 0.1])) : 0
    const total = round(subtotal + taxTotal - discountTotal)
    const customer = rand() < 0.5 ? pick(mockCustomers) : undefined
    let method = pick(methodPool)
    let amountDue = 0
    let dueDate: string | undefined
    if (customer && rand() < 0.07 && total > 800) {
      method = "credit"
      if (day < 45) {
        amountDue = round(total * pick([0.5, 0.75, 1]))
        dueDate = new Date(createdDate.getTime() + 14 * 86400000).toISOString()
      }
    }
    const status: Sale["status"] = rand() < 0.03 ? "refunded" : "completed"
    const paid = total - amountDue
    counter++
    seedSales.push({
      id: saleId,
      businessId: mockBusiness.id,
      branchId,
      customerId: customer?.id,
      userId: seller.id,
      orderNumber: `ORD-${10000 + counter}`,
      receiptNumber: `RCP-${100000 + counter}`,
      status,
      subtotal,
      taxTotal,
      discountTotal,
      total,
      paidAmount: paid,
      changeAmount: 0,
      amountDue: status === "completed" && amountDue > 0 ? amountDue : undefined,
      dueDate: status === "completed" && amountDue > 0 ? dueDate : undefined,
      paymentMethod: method,
      reference: method === "mobile_money" ? `S${String.fromCharCode(65 + Math.floor(rand() * 26))}${Math.floor(rand() * 9e7 + 1e7)}K` : undefined,
      refundReason: status === "refunded" ? pick(["Damaged item", "Wrong item", "Customer changed mind", "Expired product"]) : undefined,
      approvedBy: status === "refunded" ? manager.name : undefined,
      synced: true,
      items: lines.map((l) => ({
        id: generateId(),
        saleId,
        productId: l.product.id,
        quantity: l.quantity,
        unitPrice: l.product.sellingPrice,
        unitCost: l.product.costPrice,
        discount: 0,
        tax: l.tax,
        total: l.product.sellingPrice * l.quantity + l.tax,
      })),
      payments: paid > 0 ? [{ id: generateId(), saleId, method, amount: paid, status: "completed" as const, createdAt }] : [],
      createdAt,
    })
  }
}
seedSales.reverse() // newest first

// Make each customer's credit balance match their open credit sales.
mockCustomers.forEach((c, i) => {
  const open = seedSales.filter((s) => s.customerId === c.id && s.amountDue)
  c.amountOwed = round(open.reduce((sum, s) => sum + (s.amountDue ?? 0), 0))
  c.creditLimit = [20000, 10000, 50000, 8000, 15000][i % 5]
  c.creditDueDate = open.length ? open[open.length - 1].dueDate : undefined
  c.marketingConsent = i % 3 !== 2
})

// ---------- Purchase orders, transfers, expenses ----------
const poStatuses: PurchaseOrder["status"][] = ["received", "approved", "pending", "received", "draft", "cancelled"]
export const seedPurchaseOrders: PurchaseOrder[] = poStatuses.map((status, i) => {
  const poId = generateId()
  const items = Array.from({ length: 2 + (i % 3) }, (_, j) => {
    const product = mockProducts[(i * 3 + j) % mockProducts.length]
    const quantity = 24 * (1 + ((i + j) % 4))
    return {
      id: generateId(), purchaseOrderId: poId, productId: product.id, quantity,
      received: status === "received" ? quantity : 0, unitPrice: product.costPrice, total: product.costPrice * quantity,
    }
  })
  const createdAt = daysAgo(3 + i * 4)
  return {
    id: poId, businessId: mockBusiness.id, supplierId: mockSuppliers[i % mockSuppliers.length].id,
    warehouseId: mockWarehouses[0].id, orderNumber: `PO-${3100 + i}`, status,
    total: items.reduce((s, it) => s + it.total, 0), notes: i % 2 ? "Deliver before weekend" : undefined,
    items, createdBy: owner.id, createdAt, updatedAt: createdAt,
  }
})

const transferStatuses: StockTransfer["status"][] = ["completed", "pending", "approved", "completed", "cancelled"]
export const seedTransfers: StockTransfer[] = transferStatuses.map((status, i) => {
  const createdAt = daysAgo(2 + i * 3)
  return {
    id: generateId(), businessId: mockBusiness.id, fromWarehouseId: mockWarehouses[0].id, toWarehouseId: mockWarehouses[1].id,
    fromBranchId: i % 3 === 2 ? eastleighBranchId : mainBranch, toBranchId: i % 3 === 2 ? mainBranch : eastleighBranchId,
    productId: mockProducts[(i * 2) % mockProducts.length].id, quantity: 12 * (i + 1), status,
    notes: i % 2 ? "Restock Eastleigh branch" : "Restock store backroom", createdBy: owner.id, createdAt, updatedAt: createdAt,
  }
})

const monthlyExpenses: [string, string, number, string][] = [
  ["Rent", "Monthly shop rent", 60000, "RNT"],
  ["Salaries", "Staff payroll", 148000, "PAY"],
  ["Utilities", "Electricity and water", 14200, "UTL"],
  ["Transport", "Supplier deliveries", 9800, "TRN"],
  ["Marketing", "Social media and flyers", 12500, "MKT"],
  ["Supplies", "Packaging and receipt rolls", 6400, "SUP"],
]
export const seedTransactions: Transaction[] = []
for (let m = 11; m >= 0; m--) {
  monthlyExpenses.forEach(([category, description, amount, code], i) => {
    const date = at(m * 30 + 3 + i, 11).toISOString()
    const factor = category === "Rent" || category === "Salaries" ? 1 : 0.85 + rand() * 0.35
    const total = Math.round(amount * factor)
    // Shared costs are split between the two branches (65% / 35%).
    ;[[mainBranch, 0.65, ""], [eastleighBranchId, 0.35, "E"]].forEach(([branch, share, tag]) => {
      seedTransactions.push({
        id: generateId(), businessId: mockBusiness.id, branchId: branch as string, type: "expense", category,
        amount: Math.round(total * (share as number)), description, reference: `${code}-${m}${i}${tag}`, date, createdAt: date,
      })
    })
  })
  const rentalDate = at(m * 30 + 5, 10).toISOString()
  seedTransactions.push({
    id: generateId(), businessId: mockBusiness.id, type: "income", category: "Other Income", amount: 18000,
    description: "Shelf space rental", reference: `INC-${900 + m}`, date: rentalDate, createdAt: rentalDate,
  })
}
// Small day-to-day costs so "today" and "this week" have expenses too.
for (let d = 0; d < 90; d++) {
  if (rand() < 0.3) continue
  const east = rand() < 0.35
  const date = at(d, 15).toISOString()
  const [category, description] = pick([["Transport", "Boda boda deliveries"], ["Supplies", "Cleaning and packaging"], ["Petty cash", "Staff tea and snacks"], ["Maintenance", "Minor repairs"]])
  seedTransactions.push({
    id: generateId(), businessId: mockBusiness.id, branchId: east ? eastleighBranchId : mainBranch, type: "expense", category,
    amount: 250 + Math.floor(rand() * 11) * 100, description, reference: `PC-${d}`, date, createdAt: date,
  })
}
seedTransactions.sort((a, b) => b.date.localeCompare(a.date))

// ---------- Notifications, adjustments ----------
export const seedNotifications: Notification[] = [
  { title: "Low stock alert", message: "Kit Kat 45g is running low at the Westlands Store.", type: "warning" as const, roles: ["owner", "manager", "stockkeeper"] as Role[] },
  { title: "Credit payment due", message: "Fatuma Hassan's account payment is due this week.", type: "warning" as const, roles: ["owner", "manager"] as Role[] },
  { title: "Purchase order received", message: "PO-3100 from Savanna Distributors Ltd was received.", type: "success" as const, roles: ["owner", "manager", "stockkeeper"] as Role[] },
  { title: "Daily summary ready", message: "Yesterday's sales summary is ready to review.", type: "info" as const, roles: ["owner", "manager"] as Role[] },
  { title: "New customer", message: "Njeri Wambui joined the VIP group.", type: "info" as const, roles: ["owner", "manager", "cashier"] as Role[] },
].map((n, i) => ({ id: generateId(), userId: "", ...n, read: i > 1, createdAt: daysAgo(i) }))

export const seedAdjustments: StockAdjustment[] = mockProducts.slice(0, 8).map((product, i) => ({
  id: generateId(), productId: product.id, productName: product.name, sku: product.sku,
  change: [-3, 12, -1, 24, -6, 10, -2, 5][i],
  reason: ["Damaged goods", "Stock count correction", "Expired", "Supplier bonus", "Theft/loss", "Returned to stock", "Sample given", "Stock count correction"][i],
  userName: [stockkeeper, manager, stockkeeper, owner][i % 4].name,
  createdAt: daysAgo(i * 2 + 1, 15),
}))

// ---------- Shifts with cash reconciliation ----------
export const seedShiftRecords: ShiftRecord[] = []
const variances = [0, 0, -150, 0, 200, 0, -700, 0, 0, 50, 0, 0]
;[
  { user: cashierMain, branch: mainBranch, float: 5000 },
  { user: cashierEast, branch: eastleighBranchId, float: 3000 },
].forEach(({ user, branch, float }, u) => {
  for (let d = 12; d >= 1; d--) {
    const open = at(d, 7, 55)
    const close = at(d, 19, 5)
    const cash = seedSales
      .filter((s) => s.userId === user.id && s.status === "completed" && new Date(s.createdAt).toDateString() === open.toDateString())
      .reduce((sum, s) => sum + (s.payments ?? []).filter((p) => p.method === "cash").reduce((a, p) => a + p.amount, 0), 0)
    const expected = Math.round(float + cash)
    const variance = variances[(d + u * 5) % variances.length]
    seedShiftRecords.push({
      id: generateId(), userId: user.id, userName: user.name, branchId: branch, openedAt: open.toISOString(),
      closedAt: close.toISOString(), openingCash: float, expectedCash: expected, countedCash: expected + variance, variance,
      notes: variance < -500 ? "Short — change given in error, under review" : undefined,
    })
  }
})
seedShiftRecords.push({
  id: generateId(), userId: cashierMain.id, userName: cashierMain.name, branchId: mainBranch,
  openedAt: at(0, 7, 58).toISOString(), openingCash: 5000,
})
seedShiftRecords.sort((a, b) => b.openedAt.localeCompare(a.openedAt))

// ---------- Promotions ----------
const kitKat = mockProducts.find((p) => p.name.startsWith("Kit Kat"))
export const seedPromotions: Promotion[] = [
  { id: generateId(), code: "KARIBU10", name: "Welcome offer - 10% off", type: "percent", value: 10, startsAt: daysAgo(60), endsAt: daysAgo(-60), isActive: true, uses: 38 },
  { id: generateId(), code: "SHILINGI100", name: "KES 100 off big baskets", type: "fixed", value: 100, startsAt: daysAgo(30), endsAt: daysAgo(-30), isActive: true, uses: 21 },
  { id: generateId(), code: "KITKAT-BOGO", name: "Buy one Kit Kat, get one free", type: "bogo", value: 1, productId: kitKat?.id, startsAt: daysAgo(14), endsAt: daysAgo(-14), isActive: true, uses: 12 },
  { id: generateId(), code: "WEEKEND5", name: "Weekend 5% off (scheduled)", type: "percent", value: 5, startsAt: daysAgo(-3), endsAt: daysAgo(-35), isActive: true, uses: 0 },
  { id: generateId(), code: "EID2025", name: "Eid special", type: "percent", value: 15, startsAt: daysAgo(200), endsAt: daysAgo(190), isActive: false, uses: 77 },
]

// ---------- Audit trail ----------
const auditTemplates: [string, string, string, AuditLog["severity"], typeof owner][] = [
  ["Price changed", "Product", "Coca-Cola Classic 330ml: KES 60 → KES 65", "info", manager],
  ["Refund issued", "Sale", "ORD-10412 refunded (Damaged item), approved by Atieno Ouma", "warning", cashierMain],
  ["Discount applied", "Sale", "10% discount on ORD-10450, approved by Atieno Ouma", "info", cashierMain],
  ["Stock adjusted", "Product", "Nestlé Pure Life Water 500ml: -6 (Theft/loss)", "warning", stockkeeper],
  ["Product archived", "Product", "Nike Running Socks archived", "info", manager],
  ["Sale voided", "Sale", "ORD-10388 voided (Wrong item scanned), approved by Atieno Ouma", "warning", cashierEast],
  ["Product created", "Product", "Samsung Wireless Charger added to the catalog", "info", stockkeeper],
  ["Purchase order approved", "Purchase order", "PO-3101 approved (KES 48,200)", "info", owner],
  ["Goods received", "Purchase order", "PO-3100 received into Main Warehouse", "info", stockkeeper],
  ["Customer payment", "Customer", "Fatuma Hassan paid KES 3,500 (M-Pesa) towards their account", "info", cashierMain],
  ["Stock adjusted", "Product", "Kit Kat 45g: +24 (Received from supplier)", "info", stockkeeper],
  ["Staff role changed", "Staff", "Otieno Odhiambo set to Cashier (Eastleigh Branch)", "info", owner],
  ["Shift closed", "Shift", "Counted KES 8,420 vs expected KES 9,120 (variance -700)", "warning", cashierEast],
  ["Backup exported", "System", "Full data backup downloaded", "info", owner],
]
export const seedAuditLogs: AuditLog[] = Array.from({ length: 36 }, (_, i) => {
  const [action, entity, detail, severity, user] = auditTemplates[i % auditTemplates.length]
  return {
    id: generateId(), userId: user.id, userName: user.name, role: user.role, action, entity, detail, severity,
    createdAt: at(Math.floor(i / 2.5), 9 + (i % 9)).toISOString(),
  }
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
