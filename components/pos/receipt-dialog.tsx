"use client"

import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReceiptSlip, ReceiptPrintRoot, printReceipt, useAutoPrint } from "@/components/pos/receipt-slip"
import { formatCurrency } from "@/lib/utils/format"
import type { Sale } from "@/lib/types"
import { Printer, CheckCircle2, WifiOff } from "lucide-react"

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
  useAutoPrint(!reprint)

  const print = () => printReceipt()

  return (
    <Dialog open onClose={onClose} title={title ?? (reprint ? "Reprint receipt" : "Sale complete")} size="md">
      <div className="space-y-4">
        {!reprint && (
          <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700"><CheckCircle2 className="h-4 w-4" />Payment received - {formatCurrency(sale.total)}</p>
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
          <Button variant="secondary" className="w-full" onClick={onClose}>{reprint ? "Close" : "New sale"}</Button>
        </div>
      </div>
    </Dialog>
  )
}
