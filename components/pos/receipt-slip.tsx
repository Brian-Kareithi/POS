"use client"

import { useEffect, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { QRCode } from "@/components/ui/qr-code"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { PAYMENT_METHOD_LABELS } from "@/lib/constants"
import { useReceiptSettings, type PaperSize } from "@/lib/stores/receipt-settings"
import { formatDateTime } from "@/lib/utils/format"
import type { Sale } from "@/lib/types"

const methodLabel = PAYMENT_METHOD_LABELS
const money = (n: number) => n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * The receipt itself. It is styled like paper (white, dark ink) in BOTH themes so what you see is what prints.
 * Colours come from the .receipt-paper rules in globals.css, not from the app theme.
 */
export function ReceiptSlip({ sale, paper, printing }: { sale: Sale; paper?: PaperSize; printing?: boolean }) {
  const { business, branches, products, customers, users } = useDataStore()
  const settings = useReceiptSettings()
  const size = paper ?? settings.paper
  const customer = customers.find((c) => c.id === sale.customerId)
  const me = useAuthStore((s) => s.user)
  const cashier = users.find((u) => u.id === sale.userId) ?? (sale.userId && sale.userId === me?.id ? me : undefined)
  const branch = branches.find((b) => b.id === sale.branchId) ?? branches[0]
  const ref = sale.receiptNumber ?? sale.orderNumber
  // The server only stamps a real invoice number once a KRA device is connected; a placeholder is never printed as if it were real.
  const realEtims = !!sale.etimsInvoiceNo && !sale.etimsInvoiceNo.startsWith("STUB-")

  return (
    <div
      className={`receipt-paper${printing ? " print-receipt" : ""}`}
      data-paper={size}
      style={{ ["--paper-w" as string]: size === "58mm" ? "58mm" : size === "80mm" ? "80mm" : "180mm" }}
    >
      <div className="r-center">
        <p className="r-title">{business?.name ?? ""}</p>
        {branch?.name && <p>{branch.name}</p>}
        {branch?.address && <p>{branch.address}</p>}
        {branch?.phone && <p>Tel {branch.phone}</p>}
        {settings.kraPin && <p>KRA PIN: {settings.kraPin}</p>}
        {settings.headerText && <p className="r-muted r-gap">{settings.headerText}</p>}
      </div>
      <div className="r-rule" />
      <p>Receipt: {ref}</p>
      <p>Date: {formatDateTime(sale.createdAt)}</p>
      <p>Served by: {cashier?.name ?? "Staff"}</p>
      {customer && <p>Customer: {customer.name}</p>}
      <div className="r-rule" />
      {sale.items?.map((i) => {
        const product = products.find((p) => p.id === i.productId)
        return (
          <div key={i.id} className="r-item">
            <p>{i.name ?? product?.name ?? "Item"}</p>
            <p className="r-row r-muted"><span>{i.quantity} × {money(i.unitPrice)}</span><span className="r-ink">{money(i.quantity * i.unitPrice)}</span></p>
          </div>
        )
      })}
      <div className="r-rule" />
      <p className="r-row"><span>Subtotal</span><span>{money(sale.subtotal)}</span></p>
      {sale.discountTotal > 0 && <p className="r-row"><span>Discount{sale.couponCode ? ` (${sale.couponCode})` : ""}</span><span>-{money(sale.discountTotal)}</span></p>}
      <p className="r-row"><span>VAT included</span><span>{money(sale.taxTotal)}</span></p>
      <p className="r-row r-total"><span>TOTAL KES</span><span>{money(sale.total)}</span></p>
      <div className="r-rule" />
      {sale.payments?.map((p) => (
        <p key={p.id} className="r-row"><span>{methodLabel[p.method] ?? p.method}{p.reference ? ` ${p.reference}` : ""}</span><span>{money(p.amount)}</span></p>
      ))}
      {sale.changeAmount > 0 && <p className="r-row"><span>Change</span><span>{money(sale.changeAmount)}</span></p>}
      {sale.amountDue ? <p className="r-row r-bold"><span>Balance on account</span><span>{money(sale.amountDue)}</span></p> : null}
      {(sale.loyaltyEarned || sale.loyaltyRedeemed) ? (
        <p className="r-gap">Points: +{sale.loyaltyEarned ?? 0}{sale.loyaltyRedeemed ? ` / redeemed ${sale.loyaltyRedeemed}` : ""}</p>
      ) : null}
      <div className="r-center r-gap">
        {realEtims && (
          <>
            <div className="r-qr"><QRCode value={`https://itax.kra.go.ke/etims/${sale.etimsInvoiceNo}`} size={size === "58mm" ? 72 : 88} /></div>
            <p className="r-muted">KRA eTIMS · {sale.etimsInvoiceNo}</p>
          </>
        )}
        {settings.terms && <p className="r-muted r-gap">{settings.terms}</p>}
        {settings.footerText && <p className="r-bold r-gap">{settings.footerText}</p>}
      </div>
    </div>
  )
}

const subscribe = () => () => {}

/**
 * Print-only copy of the receipt, mounted on <body> so nothing in the app (dialogs, scroll areas) can clip it.
 * Hidden on screen; shown only while body has .receipt-printing (see printReceipt).
 */
export function ReceiptPrintRoot({ sale }: { sale: Sale | null }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const paper = useReceiptSettings((s) => s.paper)
  if (!mounted || !sale) return null
  const page = paper === "a4" ? "A4; margin: 14mm" : `${paper} auto; margin: 3mm`
  return createPortal(
    <div className="print-root">
      <style>{`@media print { @page { size: ${page}; } }`}</style>
      <ReceiptSlip sale={sale} printing />
    </div>,
    document.body
  )
}

/** Opens the browser print dialog with only the receipt on the page. */
export function printReceipt() {
  const body = document.body
  body.classList.add("receipt-printing")
  const done = () => {
    body.classList.remove("receipt-printing")
    window.removeEventListener("afterprint", done)
  }
  window.addEventListener("afterprint", done)
  // Let the print copy settle first, then print.
  window.setTimeout(() => window.print(), 50)
}

/** Print automatically once, when the setting is on (used right after a sale completes). */
export function useAutoPrint(enabled: boolean) {
  const autoPrint = useReceiptSettings((s) => s.autoPrint)
  useEffect(() => {
    if (!enabled || !autoPrint) return
    const t = window.setTimeout(printReceipt, 500)
    return () => window.clearTimeout(t)
  }, [enabled, autoPrint])
}
