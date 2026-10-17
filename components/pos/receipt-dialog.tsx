"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QRCode } from "@/components/ui/qr-code"
import { useDataStore } from "@/lib/stores/data-store"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { notify } from "@/lib/toast"
import type { Sale } from "@/lib/types"
import { Mail, MessageCircle, MessageSquare, Printer, CheckCircle2, WifiOff } from "lucide-react"

interface Props {
  sale: Sale | null
  onClose: () => void
  /** True when the receipt is being printed again for an old sale. */
  reprint?: boolean
  title?: string
}

const methodLabel: Record<string, string> = { cash: "Cash", card: "Card", mobile_money: "M-Pesa", bank_transfer: "Bank transfer", credit: "On account" }

export function ReceiptDialog({ sale, onClose, reprint, title }: Props) {
  return sale ? <Receipt key={sale.id} sale={sale} onClose={onClose} reprint={reprint} title={title} /> : null
}

function Receipt({ sale, onClose, reprint, title }: { sale: Sale; onClose: () => void; reprint?: boolean; title?: string }) {
  const { business, branches, products, customers, users, logAudit } = useDataStore()
  const customer = customers.find((c) => c.id === sale.customerId)
  const cashier = users.find((u) => u.id === sale.userId)
  const branch = branches.find((b) => b.id === sale.branchId) ?? branches[0]
  const [channel, setChannel] = useState<"sms" | "email" | "whatsapp">("sms")
  const [target, setTarget] = useState(customer?.phone ?? "")
  const [sent, setSent] = useState("")

  const pickChannel = (c: typeof channel) => {
    setChannel(c)
    setSent("")
    setTarget(c === "email" ? customer?.email ?? "" : customer?.phone ?? "")
  }

  const send = () => {
    if (!target.trim()) return
    notify.success("Receipt sent", `${channel === "sms" ? "SMS" : channel === "email" ? "Email" : "WhatsApp"} to ${target}`)
    setSent(`Receipt ${sale.receiptNumber} sent by ${channel === "sms" ? "SMS" : channel === "email" ? "email" : "WhatsApp"} to ${target}`)
  }

  const print = () => {
    if (reprint) logAudit("Receipt reprinted", "Sale", `${sale.receiptNumber ?? sale.orderNumber} reprinted (no new sale recorded)`)
    window.print()
  }

  return (
    <Dialog open onClose={onClose} title={title ?? (reprint ? "Reprint receipt" : "Sale complete")} size="md">
      <div className="space-y-4">
        {!reprint && (
          <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700"><CheckCircle2 className="h-4 w-4" />Payment received — {formatCurrency(sale.total)}</p>
        )}
        {sale.synced === false && (
          <p className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700"><WifiOff className="h-4 w-4" />Saved offline. It will sync when you are back online.</p>
        )}

        <div className="print-receipt mx-auto w-full max-w-[320px] rounded-lg border border-dashed border-gray-300 bg-white p-4 font-mono text-xs text-gray-800">
          <div className="text-center">
            <p className="text-sm font-bold">{business?.name ?? "Jamii Retail"}</p>
            <p>{branch?.name}</p>
            <p>{branch?.address}</p>
            <p>Tel {branch?.phone}</p>
            <p>KRA PIN: P051234567X</p>
          </div>
          <div className="my-2 border-t border-dashed border-gray-400" />
          <div className="space-y-0.5">
            <p>Receipt: {sale.receiptNumber ?? sale.orderNumber}</p>
            <p>Date: {formatDateTime(sale.createdAt)}</p>
            <p>Served by: {cashier?.name ?? "Staff"}</p>
            {customer && <p>Customer: {customer.name}</p>}
          </div>
          <div className="my-2 border-t border-dashed border-gray-400" />
          {sale.items?.map((i) => {
            const product = products.find((p) => p.id === i.productId)
            return (
              <div key={i.id} className="mb-1">
                <p>{product?.name ?? "Item"}</p>
                <p className="flex justify-between"><span>{i.quantity} x {i.unitPrice.toLocaleString()}</span><span>{(i.quantity * i.unitPrice).toLocaleString()}</span></p>
              </div>
            )
          })}
          <div className="my-2 border-t border-dashed border-gray-400" />
          <p className="flex justify-between"><span>Subtotal</span><span>{sale.subtotal.toLocaleString()}</span></p>
          {sale.discountTotal > 0 && <p className="flex justify-between"><span>Discount{sale.couponCode ? ` (${sale.couponCode})` : ""}</span><span>-{sale.discountTotal.toLocaleString()}</span></p>}
          <p className="flex justify-between"><span>VAT included</span><span>{sale.taxTotal.toLocaleString()}</span></p>
          <p className="mt-1 flex justify-between text-sm font-bold"><span>TOTAL KES</span><span>{sale.total.toLocaleString()}</span></p>
          <div className="my-2 border-t border-dashed border-gray-400" />
          {sale.payments?.map((p) => (
            <p key={p.id} className="flex justify-between"><span>{methodLabel[p.method]}{p.reference ? ` ${p.reference}` : ""}</span><span>{p.amount.toLocaleString()}</span></p>
          ))}
          {sale.changeAmount > 0 && <p className="flex justify-between"><span>Change</span><span>{sale.changeAmount.toLocaleString()}</span></p>}
          {sale.amountDue ? <p className="flex justify-between font-bold"><span>Balance on account</span><span>{sale.amountDue.toLocaleString()}</span></p> : null}
          {(sale.loyaltyEarned || sale.loyaltyRedeemed) ? (
            <p className="mt-1">Points: +{sale.loyaltyEarned ?? 0}{sale.loyaltyRedeemed ? ` / redeemed ${sale.loyaltyRedeemed}` : ""}</p>
          ) : null}
          <div className="my-2 flex justify-center"><QRCode value={`https://itax.kra.go.ke/etims/${sale.receiptNumber ?? sale.id}`} size={84} /></div>
          <p className="text-center">KRA eTIMS · CU No. {String(sale.id).slice(0, 10).toUpperCase()}</p>
          <p className="mt-1 text-center">Goods once sold may be returned within 7 days with this receipt. Asante, karibu tena!</p>
        </div>

        <div className="no-print space-y-3">
          <Button className="w-full" onClick={print}><Printer className="h-4 w-4" />Print receipt</Button>
          <div className="rounded-lg border border-gray-100 p-3">
            <p className="mb-2 text-sm font-medium text-gray-700">Send a digital receipt</p>
            <div className="mb-2 grid grid-cols-3 gap-2">
              {([["sms", "SMS", <MessageSquare key="s" className="h-4 w-4" />], ["email", "Email", <Mail key="e" className="h-4 w-4" />], ["whatsapp", "WhatsApp", <MessageCircle key="w" className="h-4 w-4" />]] as const).map(([id, name, icon]) => (
                <button key={id} onClick={() => pickChannel(id)} className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium ${channel === id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>{icon}{name}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><Input value={target} onChange={(e) => { setTarget(e.target.value); setSent("") }} placeholder={channel === "email" ? "name@email.com" : "0712 345 678"} /></div>
              <Button variant="secondary" onClick={send} disabled={!target.trim()}>Send</Button>
            </div>
            {sent && <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />{sent}</p>}
          </div>
          <Button variant="secondary" className="w-full" onClick={onClose}>{reprint ? "Close" : "New sale"}</Button>
        </div>
      </div>
    </Dialog>
  )
}
