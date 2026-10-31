"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Cat } from "@/components/brand/cat"
import { PaymentDialog } from "@/components/pos/payment-dialog"
import { ReceiptDialog } from "@/components/pos/receipt-dialog"
import { ApprovalDialog } from "@/components/pos/approval-dialog"
import { CustomerPicker } from "@/components/pos/customer-picker"
import { TabShareDialog } from "@/components/tabs/tab-share-dialog"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { tabs, type Tab } from "@/lib/api/tabs"
import { ApiError, errorMessage } from "@/lib/api/client"
import { refresh } from "@/lib/api/sync"
import { can } from "@/lib/permissions"
import { getBranchStock } from "@/lib/utils/stock"
import { formatCurrency } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import type { PaymentInput } from "@/lib/services/checkout"
import type { Product, Sale } from "@/lib/types"
import { Clock, CreditCard, Minus, Plus, QrCode, Search, Smartphone, Trash2, UserRound, XCircle } from "lucide-react"

const POLL_MS = 5000

const ago = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  return mins < 1 ? "just now" : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function TabsPage() {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState<Tab[] | null>(null)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [share, setShare] = useState<Tab | null>(null)

  // New rounds and guest payments show up by themselves: poll while the page is visible.
  useEffect(() => {
    let live = true
    const tick = async () => {
      if (!live || document.visibilityState !== "visible") return
      try {
        const page = await tabs.list("open")
        if (!live) return
        setOpen(page.data)
        setError("")
      } catch (e) {
        if (!live) return
        setError(errorMessage(e, "Could not load the tabs."))
        setOpen((cur) => cur ?? [])
      }
    }
    void tick()
    const t = setInterval(() => void tick(), POLL_MS)
    const onShow = () => void tick()
    document.addEventListener("visibilitychange", onShow)
    return () => { live = false; clearInterval(t); document.removeEventListener("visibilitychange", onShow) }
  }, [])

  const replace = useCallback((t: Tab) => setOpen((cur) => (cur ?? []).map((x) => (x.id === t.id ? t : x))), [])
  const gone = useCallback((id: string) => setOpen((cur) => (cur ?? []).filter((x) => x.id !== id)), [])

  const selected = open?.find((t) => t.id === selectedId) ?? null
  const totalOpen = useMemo(() => (open ?? []).reduce((s, t) => s + t.total, 0), [open])

  if (!can(user?.role, "pos.sell")) return <EmptyState title="Tabs are for the people who take orders" description="Ask your manager if you need access." />

  return (
    <div>
      <PageHeader title="Open tabs" description="One tab per table or guest. Add rounds as they order; settle when they are ready.">
        <Button onClick={() => setCreating(true)}><Plus />New tab</Button>
      </PageHeader>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {open && open.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
          <Card><CardContent className="py-3"><p className="text-xs text-gray-500">Open tabs</p><p className="text-xl font-bold text-gray-900">{open.length}</p></CardContent></Card>
          <Card><CardContent className="py-3"><p className="text-xs text-gray-500">Still to collect</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalOpen)}</p></CardContent></Card>
        </div>
      )}

      {open === null && <p className="py-16 text-center text-sm text-gray-400">Loading tabs…</p>}

      {open?.length === 0 && (
        <EmptyState
          icon={<Cat state="idle" bowtie className="mx-auto w-28" />}
          title="No open tabs"
          description="Start a tab when a table sits down. Guests can scan its QR code to follow and pay their own bill."
          action={<Button onClick={() => setCreating(true)}><Plus />Open a tab</Button>}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {open?.map((t) => (
          <Card key={t.id} className={t.guestPaying ? "ring-2 ring-green-500" : undefined}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-gray-900">{t.label}</h3>
                  <p className="flex items-center gap-1 text-xs text-gray-500"><Clock className="h-3 w-3" />{ago(t.createdAt)} · {t.openedByName ?? "Staff"}</p>
                </div>
                {t.guestPaying ? <Badge variant="success">Guest paying</Badge> : <Badge>{t.itemCount} item{t.itemCount === 1 ? "" : "s"}</Badge>}
              </div>
              <ul className="space-y-0.5 text-xs text-gray-500">
                {t.lines.slice(0, 3).map((l) => <li key={l.id} className="flex justify-between gap-2"><span className="truncate">{l.quantity} × {l.name}</span><span>{formatCurrency(l.total)}</span></li>)}
                {t.lines.length > 3 && <li>+ {t.lines.length - 3} more</li>}
                {t.lines.length === 0 && <li>Nothing ordered yet</li>}
              </ul>
              <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                <div><p className="text-xs text-gray-500">Bill</p><p className="text-lg font-bold text-gray-900">{formatCurrency(t.total)}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShare(t)} aria-label={`QR code for ${t.label}`}><QrCode /></Button>
                  <Button size="sm" onClick={() => setSelectedId(t.id)}>Open</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <NewTabDialog
        open={creating}
        existing={open ?? []}
        onClose={() => setCreating(false)}
        onCreated={(t) => { setCreating(false); setOpen((cur) => [t, ...(cur ?? [])]); setSelectedId(t.id) }}
      />
      <TabDetail tab={selected} onClose={() => setSelectedId(null)} onChanged={replace} onGone={(id) => { setSelectedId(null); gone(id) }} onShare={setShare} />
      <TabShareDialog tab={share} onClose={() => setShare(null)} onChanged={(t) => { setShare(t); replace(t) }} />
    </div>
  )
}

// ------------------------------------------------------------------ new tab

function NewTabDialog({ open, existing, onClose, onCreated }: { open: boolean; existing: Tab[]; onClose: () => void; onCreated: (t: Tab) => void }) {
  return open ? <NewTabForm existing={existing} onClose={onClose} onCreated={onCreated} /> : null
}

function NewTabForm({ existing, onClose, onCreated }: { existing: Tab[]; onClose: () => void; onCreated: (t: Tab) => void }) {
  const [label, setLabel] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const taken = new Set(existing.map((t) => t.label.toLowerCase()))
  const next = Array.from({ length: 12 }, (_, i) => `Table ${i + 1}`).filter((s) => !taken.has(s.toLowerCase())).slice(0, 8)

  const create = async (name: string) => {
    if (!name.trim() || busy) return
    setBusy(true)
    setError("")
    try { onCreated(await tabs.open({ label: name.trim() })) }
    catch (e) { setError(errorMessage(e, "Could not open the tab.")); setBusy(false) }
  }

  return (
    <Dialog open onClose={onClose} title="New tab" size="sm">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void create(label) }}>
        <Input label="Table or guest" placeholder="Table 4, Bar, John…" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} autoFocus />
        <div className="flex flex-wrap gap-2">
          {next.map((s) => <button key={s} type="button" disabled={busy} onClick={() => void create(s)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700">{s}</button>)}
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" isLoading={busy} disabled={!label.trim()}>Open tab</Button>
      </form>
    </Dialog>
  )
}

// ------------------------------------------------------------------ one tab

type Pending = { kind: "remove"; itemId: string; quantity: number } | { kind: "cancel" }

function TabDetail(props: { tab: Tab | null; onClose: () => void; onChanged: (t: Tab) => void; onGone: (id: string) => void; onShare: (t: Tab) => void }) {
  return props.tab ? <Detail key={props.tab.id} {...props} tab={props.tab} /> : null
}

function Detail({ tab, onClose, onChanged, onGone, onShare }: { tab: Tab; onClose: () => void; onChanged: (t: Tab) => void; onGone: (id: string) => void; onShare: (t: Tab) => void }) {
  const user = useAuthStore((s) => s.user)
  const products = useDataStore((s) => s.products)
  const categories = useDataStore((s) => s.categories)
  const branches = useDataStore((s) => s.branches)
  const customers = useDataStore((s) => s.customers)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [busy, setBusy] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const closing = useRef(false)

  const branchIds = branches.map((b) => b.id)
  const here = tab.branchId || user?.branchId || branchIds[0] || ""
  const customer = customers.find((c) => c.id === tab.customerId)
  const locked = tab.guestPaying
  const items = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => p.isActive && (category === "all" || p.categoryId === category) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)))
  }, [products, category, search])
  const qtyOf = (p: Product) => tab.lines.filter((l) => l.productId === p.id).reduce((s, l) => s + l.quantity, 0)

  // A tab someone else closed or cancelled while this was open: step back to the list.
  const handle = (e: unknown, title: string) => {
    notify.error(title, errorMessage(e))
    if (e instanceof ApiError && (e.code === "TAB_NOT_OPEN" || e.status === 404)) onGone(tab.id)
  }

  const add = async (p: Product) => {
    if (busy) return
    const stock = getBranchStock(p, here, branchIds)
    if (qtyOf(p) + 1 > stock) return notify.warning(stock === 0 ? "Out of stock" : "Not enough stock", p.name)
    setBusy(true)
    try { onChanged(await tabs.add(tab.id, [{ productId: p.id, quantity: 1 }])) }
    catch (e) { handle(e, "Could not add that") }
    finally { setBusy(false) }
  }

  const setQty = async (itemId: string, quantity: number, approvalToken?: string) => {
    if (busy) return
    setBusy(true)
    try { onChanged(await tabs.setQuantity(tab.id, itemId, quantity, approvalToken)); setPending(null) }
    catch (e) {
      if (e instanceof ApiError && e.code === "APPROVAL_REQUIRED") setPending({ kind: "remove", itemId, quantity })
      else handle(e, "Could not change that")
    } finally { setBusy(false) }
  }

  const attachGuest = async (customerId: string | null) => {
    setCustomerOpen(false)
    setBusy(true)
    try { onChanged(await tabs.rename(tab.id, { customerId })) }
    catch (e) { handle(e, "Could not attach the guest") }
    finally { setBusy(false) }
  }

  const cancelTab = async (reason: string, approvalToken?: string) => {
    try {
      await tabs.cancel(tab.id, reason, approvalToken)
      notify.info("Tab cancelled", tab.label)
      onGone(tab.id)
    } catch (e) {
      if (e instanceof ApiError && e.code === "APPROVAL_REQUIRED") setPending({ kind: "cancel" })
      else handle(e, "Could not cancel the tab")
    }
  }

  const finish = async (result: { payments: PaymentInput[]; cashTendered?: number }) => {
    if (closing.current) return
    closing.current = true
    setBusy(true)
    try {
      const sale = await tabs.close(tab.id, { payments: result.payments, cashTendered: result.cashTendered, customerId: tab.customerId ?? undefined })
      useDataStore.getState().upsert("sales", sale, true)
      await Promise.allSettled([refresh.products(), sale.customerId ? refresh.customer(sale.customerId) : Promise.resolve()])
      setPayOpen(false)
      setReceipt(sale)
      notify.success(`${tab.label} settled`, formatCurrency(sale.total))
    } catch (e) {
      notify.error("Tab not settled", `${errorMessage(e)} Nothing was charged.`)
      if (e instanceof ApiError && (e.code === "TAB_CHANGED" || e.code === "PAYMENT_IN_PROGRESS")) setPayOpen(false)
    } finally { closing.current = false; setBusy(false) }
  }

  const blocked = tab.lines.some((l) => l.unavailable)

  return (
    <>
      <Dialog open={!receipt} onClose={onClose} title={tab.label} size="xl">
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <section className="min-w-0">
            <label className="mb-3 flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-gray-400"><Search className="h-4 w-4" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the menu" className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none" /></label>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {[{ id: "all", name: "All" }, ...categories.filter((c) => c.isActive)].map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${category === c.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{c.name}</button>
              ))}
            </div>
            <div className="grid max-h-[46vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {items.map((p) => {
                const q = qtyOf(p)
                const stock = getBranchStock(p, here, branchIds)
                return (
                  <button key={p.id} disabled={busy || locked || stock === 0} onClick={() => void add(p)} className={`relative rounded-xl border p-3 text-left transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${q ? "border-blue-600 bg-blue-50/50" : "border-gray-100"}`}>
                    {q > 0 && <span className="absolute right-2 top-2 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{q}</span>}
                    <span className="line-clamp-2 block min-h-8 pr-5 text-xs font-medium text-gray-900">{p.name}</span>
                    <span className="mt-1 flex items-center justify-between text-[11px]"><span className="font-bold text-blue-700">{formatCurrency(p.sellingPrice)}</span><span className={stock === 0 ? "text-red-600" : "text-gray-400"}>{stock === 0 ? "Out" : stock}</span></span>
                  </button>
                )
              })}
              {items.length === 0 && <p className="col-span-full py-8 text-center text-sm text-gray-400">Nothing matches.</p>}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button onClick={() => setCustomerOpen(true)} className="flex min-w-0 items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900"><UserRound className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{customer ? customer.name : "Add guest (loyalty / credit)"}</span></button>
              <Button size="sm" variant="secondary" onClick={() => onShare(tab)}><QrCode />Guest QR</Button>
            </div>
            {locked && <p role="status" className="mb-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-800"><Smartphone className="h-4 w-4 shrink-0" />The guest is paying from their phone. It will settle by itself.</p>}
            {blocked && <p role="alert" className="mb-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">An item on this tab is no longer on the menu. Remove it to continue.</p>}
            <ul className="min-h-[120px] flex-1 space-y-2 overflow-y-auto lg:max-h-[40vh]">
              {tab.lines.length === 0 && <li className="py-8 text-center text-sm text-gray-400">Tap menu items to add them.</li>}
              {tab.lines.map((l) => (
                <li key={l.id} className="rounded-lg bg-white p-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2 text-sm"><span className={`min-w-0 font-medium ${l.unavailable ? "text-red-600 line-through" : "text-gray-900"}`}>{l.name}</span><span className="shrink-0 font-semibold">{formatCurrency(l.total)}</span></div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatCurrency(l.unitPrice)} each</span>
                    <span className="flex items-center gap-1">
                      <button aria-label={`One less ${l.name}`} disabled={busy || locked} onClick={() => void setQty(l.id, l.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                      <button aria-label={`One more ${l.name}`} disabled={busy || locked || l.unavailable} onClick={() => void setQty(l.id, l.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
                      <button aria-label={`Remove ${l.name}`} disabled={busy || locked} onClick={() => void setQty(l.id, 0)} className="ml-1 grid h-7 w-7 place-items-center rounded-full text-gray-400 hover:text-red-600 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(tab.subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>VAT</span><span>{formatCurrency(tab.taxTotal)}</span></div>
              <div className="flex justify-between text-lg font-bold text-gray-900"><span>Bill</span><span>{formatCurrency(tab.total)}</span></div>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
              <Button size="lg" disabled={tab.lines.length === 0 || busy || locked || blocked} onClick={() => setPayOpen(true)}><CreditCard />Settle {formatCurrency(tab.total)}</Button>
              <Button size="lg" variant="secondary" aria-label="Cancel this tab" disabled={busy || locked} onClick={() => void cancelTab(tab.lines.length ? "Cancelled by staff" : "Opened by mistake")}><XCircle /></Button>
            </div>
          </aside>
        </div>
      </Dialog>

      <PaymentDialog open={payOpen} total={tab.total} customer={customer} busy={busy} branchId={tab.branchId} onClose={() => setPayOpen(false)} onComplete={finish} />
      <ReceiptDialog sale={receipt} onClose={() => { setReceipt(null); onGone(tab.id) }} />
      <CustomerPicker open={customerOpen} onClose={() => setCustomerOpen(false)} onSelect={(c) => void attachGuest(c?.id ?? null)} />
      <ApprovalDialog
        open={pending !== null}
        title={pending?.kind === "cancel" ? "Cancel this tab" : "Take items off the tab"}
        description="A manager has to approve taking things off a tab after the first couple of minutes."
        needsApproval
        confirmLabel="Approve"
        onClose={() => setPending(null)}
        onConfirm={async ({ reason, approvalToken }) => {
          const p = pending
          if (p?.kind === "remove") await setQty(p.itemId, p.quantity, approvalToken)
          else if (p?.kind === "cancel") { await cancelTab(reason, approvalToken); setPending(null) }
        }}
      />
    </>
  )
}
