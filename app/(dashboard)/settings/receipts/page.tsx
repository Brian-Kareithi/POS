"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ReceiptSlip, ReceiptPrintRoot, printReceipt } from "@/components/pos/receipt-slip"
import { useDataStore } from "@/lib/stores/data-store"
import { useReceiptSettings, PAPER_LABELS, type PaperSize } from "@/lib/stores/receipt-settings"
import { Printer } from "lucide-react"
import type { Sale } from "@/lib/types"

/** Used for the preview when there is no real sale to show yet. */
const sampleSale: Sale = {
  id: "sample-receipt-0001", businessId: "", branchId: "", userId: "", orderNumber: "SAMPLE-0001", receiptNumber: "RCP-SAMPLE",
  status: "completed", subtotal: 450, taxTotal: 62.07, discountTotal: 0, total: 450, paidAmount: 500, changeAmount: 50,
  paymentMethod: "cash", synced: true, createdAt: new Date().toISOString(),
  items: [
    { id: "i1", saleId: "", productId: "", quantity: 2, unitPrice: 150, discount: 0, tax: 41.38, total: 300 },
    { id: "i2", saleId: "", productId: "", quantity: 1, unitPrice: 150, discount: 0, tax: 20.69, total: 150 },
  ],
  payments: [{ id: "p1", saleId: "", method: "cash", amount: 450, status: "completed", createdAt: new Date().toISOString() }],
} as Sale

export default function ReceiptSettingsPage() {
  const s = useReceiptSettings()
  const sales = useDataStore((d) => d.sales)
  const preview = sales.find((x) => x.status === "completed") ?? sampleSale

  return (
    <div>
      <PageHeader title="Receipt Settings" description="Changes save automatically and apply to every receipt">
        <Button variant="secondary" onClick={printReceipt}><Printer className="h-4 w-4" />Print test receipt</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Receipt template</h3></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Header message" value={s.headerText} onChange={(e) => s.update({ headerText: e.target.value })} />
            <Input label="KRA PIN" value={s.kraPin} onChange={(e) => s.update({ kraPin: e.target.value })} />
            <Textarea label="Terms and returns" value={s.terms} onChange={(e) => s.update({ terms: e.target.value })} />
            <Input label="Footer message" value={s.footerText} onChange={(e) => s.update({ footerText: e.target.value })} />
            <Select
              label="Paper size"
              value={s.paper}
              onChange={(e) => s.update({ paper: e.target.value as PaperSize })}
              options={(Object.keys(PAPER_LABELS) as PaperSize[]).map((p) => ({ value: p, label: PAPER_LABELS[p] }))}
            />
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm">
              <input type="checkbox" className="mt-0.5" checked={s.autoPrint} onChange={(e) => s.update({ autoPrint: e.target.checked })} />
              <span>
                <span className="block font-medium text-gray-900">Print automatically after each sale</span>
                <span className="text-gray-500">Opens the print dialog as soon as a sale is completed. Choose your receipt printer in the dialog; tick &ldquo;remember&rdquo; if your browser offers it.</span>
              </span>
            </label>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <p className="mb-2 text-sm font-medium text-gray-700">Preview{preview === sampleSale ? " (sample sale)" : " (latest sale)"}</p>
          <div className="rounded-xl bg-gray-50 px-3 py-5">
            <ReceiptSlip sale={preview} />
          </div>
        </div>
      </div>
      <ReceiptPrintRoot sale={preview} />
    </div>
  )
}
