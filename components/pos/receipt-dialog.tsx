"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReceiptSlip, ReceiptPrintRoot, printReceipt, useAutoPrint } from "@/components/pos/receipt-slip"
import { useDataStore } from "@/lib/stores/data-store"
import { formatCurrency } from "@/lib/utils/format"
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

export function ReceiptDialog({ sale, onClose, reprint, title }: Props) {
  return sale ? <Receipt key={sale.id} sale={sale} onClose={onClose} reprint={reprint} title={title} /> : null
}

function Receipt({ sale, onClose, reprint, title }: { sale: Sale; onClose: () => void; reprint?: boolean; title?: string }) {
  const { customers, logAudit } = useDataStore()
  const customer = customers.find((c) => c.id === sale.customerId)
  const [channel, setChannel] = useState<"sms" | "email" | "whatsapp">("sms")
  const [target, setTarget] = useState(customer?.phone ?? "")
  const [sent, setSent] = useState("")
  useAutoPrint(!reprint)

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
    printReceipt()
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

        <div className="rounded-xl bg-gray-50 px-3 py-5">
          <ReceiptSlip sale={sale} />
        </div>
        <ReceiptPrintRoot sale={sale} />

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
