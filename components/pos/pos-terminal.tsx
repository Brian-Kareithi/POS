"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { usePosStore } from "@/lib/stores/pos-store"
import { formatCurrency } from "@/lib/utils/format"
import { generateId } from "@/lib/utils/generators"
import { api, errorMessage } from "@/lib/api/client"
import { expiryStatus, daysToExpiry, getBranchStock } from "@/lib/utils/stock"
import { findProductByCode } from "@/lib/utils/barcode"
import { computeDiscount } from "@/lib/utils/pricing"
import { completeSale, priceLines, type PaymentInput } from "@/lib/services/checkout"
import { can } from "@/lib/permissions"
import { notify } from "@/lib/toast"
import { useScannerInput } from "@/lib/hooks/use-scanner-input"
import { fetchProductImage } from "@/lib/services/product-image"
import { BarcodeScanner } from "@/components/pos/barcode-scanner"
import { ProductFormDialog } from "@/components/pos/product-form-dialog"
import { PaymentDialog } from "@/components/pos/payment-dialog"
import { ReceiptDialog } from "@/components/pos/receipt-dialog"
import { CustomerPicker } from "@/components/pos/customer-picker"
import { PromoCodeBox } from "@/components/pos/promo-code-box"
import { DiscountDialog, noDiscount, type DiscountState } from "@/components/pos/discount-dialog"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Customer, Product, Sale } from "@/lib/types"
import {
  Clock, Grid2X2, ImageIcon, Minus, PackagePlus, Pause, Percent, Play, Plus, ScanLine, Search, Trash2, UserRound, WifiOff, X
} from "lucide-react"

type OrderLine = { product: Product; quantity: number }

export function PosTerminal() {
  const user = useAuthStore((state) => state.user)
  const products = useDataStore((state) => state.products)
  const categories = useDataStore((state) => state.categories)
  const customers = useDataStore((state) => state.customers)
  const promotions = useDataStore((state) => state.promotions)
  const shifts = useDataStore((state) => state.shiftRecords)
  const branches = useDataStore((state) => state.branches)
  const { held, hold, resume, discardHeld, offlineMode, loadHeld } = usePosStore()

  const [activeCategory, setActiveCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [order, setOrder] = useState<OrderLine[]>([])
  const [customerId, setCustomerId] = useState<string | undefined>()
  const [discount, setDiscount] = useState<DiscountState>(noDiscount)
  const [notice, setNotice] = useState("")
  // The product just added by a scan, so a wrong scan can be undone in one tap.
  const [lastScan, setLastScan] = useState<{ id: string; name: string } | null>(null)
  const [warning, setWarning] = useState("")
  const [unknownCode, setUnknownCode] = useState("")
  const [scanOpen, setScanOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [heldOpen, setHeldOpen] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState("")
  const keyRef = useRef(generateId())
  const searchRef = useRef<HTMLInputElement>(null)

  const branchIds = branches.map((b) => b.id)
  const here = user?.branchId ?? branchIds[0] ?? ""
  const branchName = branches.find((b) => b.id === here)?.name
  // Stock is counted per branch: you can only sell what is on this branch's shelves.
  const stockOf = (p: Product) => getBranchStock(p, here, branchIds)

  const customer: Customer | undefined = customers.find((c) => c.id === customerId)
  const myShift = shifts.find((s) => s.userId === user?.id && !s.closedAt)
  const needsShift = can(user?.role, "pos.sell") && !myShift

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products])
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return activeProducts.filter((p) =>
      (activeCategory === "all" || p.categoryId === activeCategory) &&
      (!query || p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.barcode.includes(query))
    )
  }, [activeProducts, activeCategory, search])

  const subtotal = order.reduce((sum, line) => sum + line.product.sellingPrice * line.quantity, 0)
  const disc = computeDiscount(order, subtotal, discount, promotions, customer)
  const priced = priceLines(order, disc.total)
  const itemCount = order.reduce((sum, line) => sum + line.quantity, 0)

  const inOrder = (id: string) => order.find((line) => line.product.id === id)?.quantity ?? 0

  // Returns true when the item was added (false when it can't be sold).
  const addItem = (product: Product) => {
    const live = products.find((p) => p.id === product.id) ?? product
    if (needsShift && order.length === 0) notify.warning("Open a shift to make sales", "You can build the order, but payment needs an open shift (Shifts & Cash).")
    if (expiryStatus(live) === "expired") {
      notify.warning("Cannot sell this item", `${live.name} is past its expiry date.`)
      return false
    }
    if (inOrder(live.id) + 1 > stockOf(live)) {
      notify.warning(stockOf(live) === 0 ? "Out of stock" : "Not enough stock", stockOf(live) === 0 ? `${live.name} is out of stock.` : `Only ${stockOf(live)} of ${live.name} in stock.`)
      return false
    }
    setOrder((current) => {
      const found = current.find((line) => line.product.id === live.id)
      return found
        ? current.map((line) => (line.product.id === live.id ? { ...line, quantity: line.quantity + 1 } : line))
        : [...current, { product: live, quantity: 1 }]
    })
    setNotice("")
    setWarning("")
    setUnknownCode("")
    setLastScan(null)
    return true
  }

  // Fetch a photo online for a product that has none, then save it and refresh any cart line.
  const attachImage = async (product: Product) => {
    if (product.image) return
    const image = await fetchProductImage(product.barcode, product.name)
    if (!image) return
    // Only people who may edit products can save the photo on the server; for everyone else it is just shown this session.
    if (can(user?.role, "products.edit")) {
      try { await api(`/products/${product.id}`, { method: "PATCH", body: { image } }) } catch { return }
    }
    useDataStore.getState().patch("products", product.id, { image })
    setOrder((current) => current.map((line) => (line.product.id === product.id ? { ...line, product: { ...line.product, image } } : line)))
  }

  const handleCode = (code: string) => {
    const product = findProductByCode(products, code)
    if (!product) {
      setUnknownCode(code.trim())
      setLastScan(null)
      setWarning(`No product found for "${code.trim()}".`)
      return
    }
    if (addItem(product)) {
      setNotice(`Added ${product.name}`)
      setLastScan({ id: product.id, name: product.name })
      void attachImage(product)
    }
  }

  const undoScan = () => {
    if (!lastScan) return
    updateQuantity(lastScan.id, -1)
    setNotice("")
    setLastScan(null)
  }

  useScannerInput(handleCode, !scanOpen && !addOpen && !payOpen && !customerOpen && !discountOpen && !heldOpen && !receipt)

  const updateQuantity = (id: string, change: number) => {
    setOrder((current) =>
      current.flatMap((line) => {
        if (line.product.id !== id) return [line]
        const quantity = line.quantity + change
        if (change > 0 && quantity > stockOf(products.find((p) => p.id === id) ?? line.product)) return [line]
        return quantity > 0 ? [{ ...line, quantity }] : []
      })
    )
  }

  const resetOrder = () => {
    setOrder([])
    setCustomerId(undefined)
    setDiscount(noDiscount)
    setPayError("")
    keyRef.current = generateId()
  }

  // Held sales live on the server so they follow the cashier between devices.
  useEffect(() => {
    if (can(user?.role, "pos.sell") && products.length > 0) loadHeld(products).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, products.length > 0])

  const holdOrder = async () => {
    if (!order.length) return
    try {
      await hold({
      label: `Hold ${held.length + 1}${customer ? ` · ${customer.name}` : ""}`,
      customerId,
      lines: order,
      discountKind: discount.kind,
      discountValue: discount.value,
      couponCode: discount.coupon,
      heldBy: user?.name ?? "Staff",
      })
      resetOrder()
      notify.info("Sale put on hold", "Resume it any time from the Held button.")
    } catch (error) {
      notify.error("Could not hold the sale", errorMessage(error))
    }
  }

  const resumeHeld = async (id: string) => {
    const h = held.find((x) => x.id === id)
    if (!h) return
    if (order.length) await holdOrder()
    try { await resume(id) } catch (error) { return notify.error("Could not resume the sale", errorMessage(error)) }
    // Re-check against live stock in case it changed while the sale was on hold.
    setOrder(h.lines.map((l) => ({ ...l, product: products.find((p) => p.id === l.product.id) ?? l.product })))
    setCustomerId(h.customerId)
    setDiscount({ kind: h.discountKind, value: h.discountValue, coupon: h.couponCode, redeem: 0 })
    // A held sale's coupon is checked again when the sale is saved, so no stale rule is kept here.
    setHeldOpen(false)
  }

  const openCharge = () => {
    if (!order.length) return
    if (needsShift) return notify.warning("Open a shift to make sales", "You need an open shift before taking payments. Go to Shifts & Cash to open yours.")
    setPayError("")
    setPayOpen(true)
  }

  const finishPayment = async (result: { payments: PaymentInput[]; cashTendered?: number }) => {
    if (busy) return
    setBusy(true)
    try {
      const sale = await completeSale({
        lines: order,
        payments: result.payments,
        cashTendered: result.cashTendered,
        customerId,
        branchId: here || undefined,
        manualDiscount: { kind: discount.kind, value: discount.value },
        couponCode: discount.coupon || undefined,
        loyaltyRedeemed: disc.loyalty || undefined,
        approvalToken: discount.approvalToken,
        approvedBy: discount.approvedBy,
        estimatedDiscount: disc.total,
        idempotencyKey: keyRef.current,
      })
      setPayOpen(false)
      setReceipt(sale)
      resetOrder()
      setOrderOpen(false)
      setNotice("")
    } catch (error) {
      const message = errorMessage(error, "Something went wrong.")
      setPayError(message)
      notify.error("Sale not completed", `${message} Nothing was charged.`)
    } finally {
      setBusy(false)
    }
  }

  // Keyboard shortcuts for fast checkout.
  // Ctrl+Q: start a fresh sale. A sale in progress is put on hold first, so nothing is lost.
  const newSale = async () => {
    if (order.length) await holdOrder()
    else resetOrder()
    setNotice("")
    setWarning("")
    searchRef.current?.focus()
  }
  const shortcuts = useRef({ openCharge, holdOrder, newSale })
  useEffect(() => {
    shortcuts.current = { openCharge, holdOrder, newSale }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "q") { e.preventDefault(); void shortcuts.current.newSale(); return }
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === "F4") { e.preventDefault(); shortcuts.current.openCharge() }
      if (e.key === "F6") { e.preventDefault(); shortcuts.current.holdOrder() }
      if (e.key === "F8") { e.preventDefault(); setCustomerOpen(true) }
      if (e.key === "F9") { e.preventDefault(); setDiscountOpen(true) }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div className="flex h-full min-h-0 gap-2 text-pos-ink lg:gap-3">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-pos-canvas">
        <header className="flex h-[54px] shrink-0 items-center gap-2 border-b border-pos-tile bg-white px-4">
          <label className="flex h-9 max-w-[420px] flex-1 items-center gap-2 rounded-lg border border-pos-line px-3 text-pos-muted">
            <Search size={15} />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !search.trim()) return
                if (findProductByCode(products, search)) { handleCode(search); setSearch("") }
              }}
              placeholder="Search or scan a barcode (F2)"
              className="min-w-0 flex-1 bg-transparent text-xs text-pos-text outline-none placeholder:text-pos-muted"
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setScanOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-pos-line px-3 text-xs font-medium text-pos-green hover:bg-pos-hover"><ScanLine size={15} /><span className="hidden sm:inline">Scan</span></button>
            {can(user?.role, "products.edit") && (
              <button onClick={() => { setUnknownCode(""); setAddOpen(true) }} className="flex h-9 items-center gap-1.5 rounded-lg bg-pos-brand px-3 text-xs font-semibold text-white hover:bg-pos-brand-hover"><PackagePlus size={15} /><span className="hidden sm:inline">Add product</span></button>
            )}
          </div>
        </header>

        <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pt-3 text-xs">
          {myShift ? (
            <span className="flex items-center gap-1.5 rounded-full bg-pos-accent px-3 py-1 font-medium text-pos-green"><Clock size={13} />Shift open since {new Date(myShift.openedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
          ) : (
            <Link href="/employees/shifts" className="flex items-center gap-1.5 rounded-full bg-pos-warn-bg px-3 py-1 font-medium text-pos-warn-text"><Clock size={13} />{needsShift ? "Open your shift to start selling" : "No shift open"}</Link>
          )}
          {branchName && branches.length > 1 && <span className="rounded-full bg-white px-3 py-1 font-medium text-pos-sub">Selling at {branchName}</span>}
          {offlineMode && <span className="flex items-center gap-1.5 rounded-full bg-pos-warn-bg px-3 py-1 font-medium text-pos-warn-text"><WifiOff size={13} />Offline - sales are saved on this device</span>}
          <span className="ml-auto hidden text-pos-muted xl:block">Ctrl+Q new sale · F2 search · F4 charge · F6 hold · F8 customer · F9 discount</span>
        </div>

        {/* Only the unknown-barcode warning stays on the page, because it has a button; every other warning is a toast. */}
        {warning && unknownCode && (
          <div role="alert" className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-lg bg-pos-warn-bg px-3 py-2 text-xs text-pos-warn-text">
            <span>{warning}</span>
            <span className="flex items-center gap-2">
              {unknownCode && can(user?.role, "products.edit") && <button onClick={() => setAddOpen(true)} className="font-semibold underline">Add as new product</button>}
              <button aria-label="Dismiss" onClick={() => { setWarning(""); setUnknownCode("") }}><X size={13} /></button>
            </span>
          </div>
        )}

        {lastScan && (
          <div role="status" className="anim-pop mx-4 mt-3 flex items-center justify-between gap-2 rounded-lg bg-pos-accent px-3 py-2 text-xs text-pos-green">
            <span className="min-w-0 truncate">Scanned and added <strong>{lastScan.name}</strong></span>
            <span className="flex shrink-0 items-center gap-3">
              <button onClick={undoScan} className="font-semibold underline">Undo</button>
              <button aria-label="Dismiss" onClick={() => setLastScan(null)}><X size={13} /></button>
            </span>
          </div>
        )}

        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {[{ id: "all", name: "All" }, ...categories.filter((c) => c.isActive)].map((category) => (
            <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`flex min-w-[82px] flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${activeCategory === category.id ? "border-pos-accent-line bg-pos-accent text-pos-green" : "border-transparent bg-white text-pos-text hover:border-pos-line-strong"}`}>
              <span className="mb-2 grid h-6 w-6 place-items-center rounded-md bg-white/80 dark:bg-white/10"><Grid2X2 size={15} /></span>
              <span className="whitespace-nowrap text-[11px] font-semibold">{category.name}</span>
              <span className="mt-0.5 text-[9px] text-pos-muted">{category.id === "all" ? activeProducts.length : activeProducts.filter((p) => p.categoryId === category.id).length} items</span>
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 md:pb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleItems.map((product) => {
              const quantity = inOrder(product.id)
              const stock = stockOf(product)
              const expiry = expiryStatus(product)
              const days = daysToExpiry(product)
              const blocked = stock === 0 || expiry === "expired"
              return (
                <article key={product.id} className={`overflow-hidden rounded-xl border bg-white p-2.5 shadow-sm ${quantity ? "border-[#14853b]" : "border-transparent"}`}>
                  <div className="relative grid h-28 place-items-center overflow-hidden rounded-lg bg-pos-tile text-pos-muted sm:h-24 xl:h-[108px]">
                    {product.image
                      ? <div role="img" aria-label={product.name} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${product.image}")` }} />
                      : <ImageIcon size={28} />}
                    {expiry === "soon" && <span className="absolute left-0 top-2 rounded-r bg-[#f4ce35] px-2 py-1 text-[9px] font-bold text-[#332d0c]">Expires in {days}d</span>}
                    {expiry === "expired" && <span className="absolute left-0 top-2 rounded-r bg-[#c0392b] px-2 py-1 text-[9px] font-bold text-white">Expired</span>}
                  </div>
                  <h2 className="mt-2 line-clamp-2 min-h-8 text-[11px] font-medium leading-4">{product.name}</h2>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-pos-green">{formatCurrency(product.sellingPrice)}</span>
                    <span className={stock === 0 ? "font-semibold text-pos-danger" : stock <= product.minStock ? "font-semibold text-pos-warn-text" : "text-pos-muted"}>{stock === 0 ? "Out of stock" : `${stock} in stock`}</span>
                  </div>
                  {quantity ? (
                    <div className="mt-2 flex h-8 items-center justify-between rounded-md bg-pos-accent-soft px-2 text-xs">
                      <button onClick={() => updateQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`} className="grid h-6 w-6 place-items-center rounded-full text-pos-brand"><Minus size={14} /></button>
                      <span className="font-semibold">{quantity}</span>
                      <button onClick={() => addItem(product)} aria-label={`Add one ${product.name}`} className="grid h-6 w-6 place-items-center rounded-full bg-pos-brand text-white"><Plus size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => addItem(product)} disabled={blocked} className="mt-2 h-8 w-full rounded-md bg-pos-accent-soft text-[10px] font-semibold text-pos-green hover:bg-pos-accent-soft-hover disabled:cursor-not-allowed disabled:bg-pos-disabled-bg disabled:text-pos-muted">{expiry === "expired" ? "Expired" : stock === 0 ? "Out of stock" : "Add to order"}</button>
                  )}
                </article>
              )
            })}
            {visibleItems.length === 0 && <p className="col-span-full py-12 text-center text-sm text-pos-muted">{activeProducts.length === 0 ? "No products yet. Add products to start selling." : "No products match your search."}</p>}
          </div>
        </div>
      </section>

      {itemCount > 0 && !orderOpen && <button onClick={() => setOrderOpen(true)} className="anim-pop fixed inset-x-4 bottom-4 z-10 flex h-12 items-center justify-between rounded-xl bg-pos-brand px-4 text-xs font-semibold text-white shadow-lg md:hidden">
        <span>View order · {itemCount} {itemCount === 1 ? "item" : "items"}</span><span>{formatCurrency(priced.total)}</span>
      </button>}
      {orderOpen && <div className="anim-overlay fixed inset-0 z-10 bg-black/40 md:hidden" onClick={() => setOrderOpen(false)} />}

      <aside className={`flex w-[min(340px,38vw)] shrink-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm max-md:fixed max-md:inset-x-2 max-md:bottom-2 max-md:top-16 max-md:z-20 max-md:w-auto ${orderOpen ? "max-md:anim-sheet" : "max-md:hidden"}`}>
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-pos-line px-4">
          <div><h1 className="text-sm font-bold">Current Sale</h1><p className="text-[10px] text-pos-muted">{user?.name ?? "Guest"} · {itemCount} items</p></div>
          <div className="flex items-center gap-1">
            {order.length > 0 && <button aria-label="Clear order" onClick={resetOrder} className="grid h-8 w-8 place-items-center rounded-lg border border-pos-line text-pos-muted"><Trash2 size={15} /></button>}
            <button aria-label="Close order" onClick={() => setOrderOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-pos-line md:hidden"><X size={15} /></button>
          </div>
        </header>

        <div className="mx-4 mt-3 grid shrink-0 grid-cols-3 gap-1.5 text-[10px] font-medium">
          <button onClick={() => setCustomerOpen(true)} className="flex flex-col items-center gap-1 rounded-lg border border-pos-line py-2 text-pos-sub hover:bg-pos-hover"><UserRound size={15} /><span className="max-w-full truncate px-1">{customer ? customer.name.split(" ")[0] : "Customer"}</span></button>
          <button onClick={() => setDiscountOpen(true)} className={`flex flex-col items-center gap-1 rounded-lg border py-2 hover:bg-pos-hover ${disc.total > 0 ? "border-pos-accent-line bg-pos-accent text-pos-green" : "border-pos-line text-pos-sub"}`}><Percent size={15} />Discount</button>
          <button onClick={() => (order.length ? holdOrder() : setHeldOpen(true))} className="relative flex flex-col items-center gap-1 rounded-lg border border-pos-line py-2 text-pos-sub hover:bg-pos-hover">
            {order.length ? <Pause size={15} /> : <Play size={15} />}{order.length ? "Hold" : "Held"}
            {held.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-pos-brand px-1 text-[9px] text-white">{held.length}</span>}
          </button>
        </div>
        {held.length > 0 && order.length > 0 && <button onClick={() => setHeldOpen(true)} className="mx-4 mt-1.5 text-left text-[10px] text-pos-green underline">{held.length} sale(s) on hold</button>}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {order.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-2 rounded-lg border border-pos-line p-2">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-pos-tile text-pos-muted">
                {product.image ? <div role="img" aria-label={product.name} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${product.image}")` }} /> : <ImageIcon size={18} />}
              </div>
              <div className="min-w-0 flex-1"><p className="line-clamp-2 text-[10px] font-medium leading-4">{product.name}</p><div className="mt-1 flex items-center justify-between"><span className="text-[9px] text-pos-muted">{formatCurrency(product.sellingPrice)} · {quantity}x</span><span className="text-[10px] font-bold text-pos-green">{formatCurrency(product.sellingPrice * quantity)}</span></div></div>
              <div className="flex flex-col justify-between"><button onClick={() => updateQuantity(product.id, 1)} aria-label={`Add ${product.name}`} className="text-pos-green"><Plus size={13} /></button><button onClick={() => updateQuantity(product.id, -quantity)} aria-label={`Remove ${product.name}`} className="text-pos-danger"><Trash2 size={12} /></button></div>
            </div>
          ))}
          {order.length === 0 && <div className="grid h-full place-items-center text-center text-xs text-pos-muted">Scan or tap an item to start a sale.<br />Walk-in customers need no registration.</div>}
        </div>

        <div className="shrink-0 border-t border-pos-line p-4">
          {order.length > 0 && <PromoCodeBox subtotal={subtotal} discount={discount} savings={disc.promo} onChange={setDiscount} />}
          <div className="space-y-1.5 rounded-lg bg-pos-canvas p-3 text-[10px] text-pos-sub">
            <div className="flex justify-between"><span>Sub total</span><span>{formatCurrency(subtotal)}</span></div>
            {priced.discountTotal > 0 && <div className="flex justify-between text-pos-green"><span>Discount{disc.promotion ? ` (${disc.promotion.code})` : ""}</span><span>-{formatCurrency(priced.discountTotal)}</span></div>}
            <div className="flex justify-between"><span>VAT included</span><span>{formatCurrency(priced.taxTotal)}</span></div>
            <div className="mt-2 flex justify-between border-t border-pos-line pt-2 text-xs font-bold text-pos-text"><span>Total</span><span>{formatCurrency(priced.total)}</span></div>
          </div>
          {notice && <p role="status" className="mt-2 text-[10px] font-medium text-pos-green">{notice}</p>}
          <button onClick={openCharge} disabled={!order.length} className="mt-3 h-11 w-full rounded-lg bg-pos-brand text-sm font-semibold text-white hover:bg-pos-brand-hover disabled:cursor-not-allowed disabled:bg-pos-disabled-btn">Charge {formatCurrency(priced.total)} <span className="ml-1 text-[10px] font-normal opacity-80">F4</span></button>
        </div>
      </aside>

      <BarcodeScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={handleCode} continuous />
      <ProductFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        initialBarcode={unknownCode}
        onCreated={(product) => { setWarning(""); setUnknownCode(""); addItem(product); setNotice(`${product.name} added to the catalog`); void attachImage(product) }}
      />
      <CustomerPicker open={customerOpen} onClose={() => setCustomerOpen(false)} onSelect={(c) => { setCustomerId(c?.id); setCustomerOpen(false) }} />
      <DiscountDialog open={discountOpen} subtotal={subtotal} customer={customer} current={discount} onClose={() => setDiscountOpen(false)} onApply={(state) => { setDiscount(state); setDiscountOpen(false) }} />
      <PaymentDialog open={payOpen} total={priced.total} customer={customer} busy={busy} branchId={here || undefined} onClose={() => setPayOpen(false)} onComplete={finishPayment} />
      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />
      <Dialog open={heldOpen} onClose={() => setHeldOpen(false)} title="Held sales" size="md">
        <div className="space-y-2">
          {held.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No sales on hold.</p>}
          {held.map((h) => (
            <div key={h.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{h.label}</p>
                <p className="text-xs text-gray-500">{h.lines.reduce((s, l) => s + l.quantity, 0)} items · {formatCurrency(h.lines.reduce((s, l) => s + l.quantity * l.product.sellingPrice, 0))} · {new Date(h.heldAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })} by {h.heldBy}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => resumeHeld(h.id)}>Resume</Button>
                <Button size="sm" variant="secondary" onClick={() => discardHeld(h.id).catch((e) => notify.error("Could not discard", errorMessage(e)))}>Discard</Button>
              </div>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  )
}
