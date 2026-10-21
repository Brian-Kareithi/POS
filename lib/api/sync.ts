import { ApiError, api, listAll } from "@/lib/api/client"
import { toAdjustment, toAudit, toBranch, toBusiness, toCustomer, toNotification, toProduct, toPurchaseOrder, toSale, toShift, toStaff, toSupplier, toTransaction, toTransfer, toWarehouse, clean } from "@/lib/api/mappers"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useReceiptSettings, type PaperSize } from "@/lib/stores/receipt-settings"
import { can, type Permission } from "@/lib/permissions"
import { restoreSnapshot, saveSnapshot } from "@/lib/offline/snapshot"
import { usePosStore } from "@/lib/stores/pos-store"
import type { Category, Brand, Coupon, CustomerGroup, IndustryConfig, Promotion } from "@/lib/types"

type Step = () => Promise<void>

/** Loads everything the signed-in role is allowed to see into the data store. A failing endpoint never blocks the rest. */
export async function loadAllData(): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return
  const data = useDataStore.getState()
  const has = (p: Permission) => can(user.role, p)
  const set = data.setCollection
  const errors: string[] = []
  let unreachable = false

  // Stage 1: reference data the later stages need for name look-ups.
  const stage1: Step[] = [
    async () => {
      try {
        data.setBusiness(toBusiness(await api("/business")))
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) unreachable = true
        throw e
      }
    },
    async () => data.setIndustry(await api<IndustryConfig>("/industry")),
    async () => set("branches", (await api<unknown[]>("/branches")).map(toBranch)),
    async () => {
      const s = await api<{ headerText: string; footerText: string; terms: string; kraPin: string; paper: PaperSize; autoPrint: boolean }>("/settings/receipts")
      useReceiptSettings.getState().hydrate(s)
    },
  ]
  if (has("products.view")) {
    stage1.push(
      async () => set("warehouses", (await api<unknown[]>("/warehouses")).map(toWarehouse)),
      async () => set("categories", (await listAll<unknown>("/categories")).map((r) => clean<Category>(r))),
      async () => set("brands", (await listAll<unknown>("/brands")).map((r) => clean<Brand>(r))),
      async () => set("suppliers", (await listAll<unknown>("/suppliers")).map(toSupplier)),
      async () => set("products", (await listAll<unknown>("/products")).map(toProduct)),
    )
  }
  if (has("staff.view")) {
    stage1.push(async () => {
      const rows = (await listAll<unknown>("/staff")).map(toStaff)
      set("employees", rows.map((r) => r.employee))
      set("users", rows.map((r) => r.user))
    })
  }
  await run(stage1, errors)

  // No connection: start from the copy saved on this device so the till can still sell.
  if (unreachable) {
    const savedAt = await restoreSnapshot(user.id)
    if (savedAt) {
      injectQueuedSales()
      data.setLoaded(true, null)
      return
    }
  }

  const state = useDataStore.getState()
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? (id === user.id ? user.name : "Staff")

  // Stage 2: the rest.
  const stage2: Step[] = [
    async () => {
      const res = await api<{ data: unknown[] }>("/notifications", { query: { limit: 100 } })
      set("notifications", res.data.map(toNotification))
    },
  ]
  if (has("sales.view")) stage2.push(async () => set("sales", (await listAll<unknown>("/sales", {}, 15)).map(toSale)))
  if (has("customers.manage")) {
    stage2.push(
      async () => set("customers", (await listAll<unknown>("/customers")).map(toCustomer)),
      async () => set("customerGroups", (await api<unknown[]>("/customer-groups")).map((r) => clean<CustomerGroup>(r))),
    )
  }
  if (has("pos.sell")) stage2.push(async () => set("promotions", (await api<unknown[]>("/promotions")).map((r) => clean<Promotion>(r))))
  if (has("price.change")) stage2.push(async () => set("coupons", (await api<unknown[]>("/coupons")).map((r) => clean<Coupon>(r))))
  if (has("purchase.manage")) stage2.push(async () => set("purchaseOrders", (await listAll<unknown>("/purchase-orders")).map(toPurchaseOrder)))
  if (has("products.view")) {
    stage2.push(
      async () => set("stockTransfers", (await listAll<unknown>("/transfers")).map(toTransfer)),
      async () => set("stockAdjustments", (await listAll<unknown>("/inventory/adjustments", {}, 3)).map((r) => toAdjustment(r, useDataStore.getState().products, nameOf))),
    )
  }
  if (has("expenses.manage")) stage2.push(async () => set("transactions", (await listAll<unknown>("/transactions", {}, 10)).map(toTransaction)))
  if (has("audit.view")) stage2.push(async () => set("auditLogs", (await listAll<unknown>("/audit", {}, 3)).map(toAudit)))
  if (has("shift.manage")) stage2.push(async () => set("shiftRecords", (await listAll<unknown>("/shifts", {}, 3)).map((r) => toShift(r, nameOf))))
  await run(stage2, errors)

  injectQueuedSales()
  data.setOfflineSnapshotAt(null)
  data.setLoaded(true, errors.length ? errors[0] : null)
  if (errors.length === 0) void saveSnapshot(user.id)
}

/** Sales waiting to upload show in the sales list (marked as not yet synced) until the server has them. */
export function injectQueuedSales() {
  const me = useAuthStore.getState().user
  const data = useDataStore.getState()
  for (const q of usePosStore.getState().queue) {
    if (q.userId && q.userId !== me?.id) continue
    if (q.sale && !data.sales.some((s) => s.idempotencyKey === q.idempotencyKey)) data.upsert("sales", q.sale, true)
  }
}

async function run(steps: Step[], errors: string[]) {
  const results = await Promise.allSettled(steps.map((s) => s()))
  for (const r of results) if (r.status === "rejected") errors.push(r.reason instanceof Error ? r.reason.message : "Could not load some data")
}

export const refresh = {
  async product(id: string) {
    const p = toProduct(await api(`/products/${id}`))
    useDataStore.getState().upsert("products", p)
    return p
  },
  async products() {
    useDataStore.getState().setCollection("products", (await listAll<unknown>("/products")).map(toProduct))
  },
  async customer(id: string) {
    const c = toCustomer(await api(`/customers/${id}`))
    useDataStore.getState().upsert("customers", c)
    return c
  },
  async staff() {
    const rows = (await listAll<unknown>("/staff")).map(toStaff)
    const s = useDataStore.getState()
    s.setCollection("employees", rows.map((r) => r.employee))
    s.setCollection("users", rows.map((r) => r.user))
  },
  async adjustments() {
    const s = useDataStore.getState()
    const me = useAuthStore.getState().user
    const nameOf = (id: string) => s.users.find((u) => u.id === id)?.name ?? (id === me?.id ? me.name : "Staff")
    s.setCollection("stockAdjustments", (await listAll<unknown>("/inventory/adjustments", {}, 3)).map((r) => toAdjustment(r, s.products, nameOf)))
  },
  async sales() {
    useDataStore.getState().setCollection("sales", (await listAll<unknown>("/sales", {}, 15)).map(toSale))
  },
}
