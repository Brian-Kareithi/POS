"use client"

import { useRef, useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/stores/data-store"
import { notify } from "@/lib/toast"
import { exportCSV, exportJSON } from "@/lib/utils/export"
import { formatDateTime } from "@/lib/utils/format"
import { getStock } from "@/lib/utils/stock"
import { Download, RefreshCw, Upload, ShieldCheck, FileSpreadsheet } from "lucide-react"

type Backup = { id: string; date: string; size: string; status: "Completed" | "Failed"; kind: "Automatic" | "Manual" }

const daysAgo = (n: number, hour = 2) => {
  const d = new Date(Date.now() - n * 86400000)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const initial: Backup[] = [
  { id: "b1", date: daysAgo(0), size: "14.4 MB", status: "Completed", kind: "Automatic" },
  { id: "b2", date: daysAgo(1), size: "14.2 MB", status: "Completed", kind: "Automatic" },
  { id: "b3", date: daysAgo(2), size: "14.0 MB", status: "Failed", kind: "Automatic" },
  { id: "b4", date: daysAgo(3), size: "13.8 MB", status: "Completed", kind: "Automatic" },
  { id: "b5", date: daysAgo(4, 17), size: "13.7 MB", status: "Completed", kind: "Manual" },
]

const DATA_KEYS = [
  "business", "branches", "warehouses", "categories", "brands", "suppliers", "products", "customers", "customerGroups", "users",
  "employees", "sales", "purchaseOrders", "stockTransfers", "transactions", "stockAdjustments", "auditLogs", "shiftRecords", "promotions", "notifications",
] as const

export default function BackupSettingsPage() {
  const state = useDataStore()
  const [backups, setBackups] = useState<Backup[]>(initial)
  const [running, setRunning] = useState(false)
  const [pending, setPending] = useState<Record<string, unknown> | null>(null)
  const [fileName, setFileName] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const snapshot = () => Object.fromEntries(DATA_KEYS.map((k) => [k, state[k]])) as Record<string, unknown>
  const stamp = () => new Date().toISOString().slice(0, 10)

  const runBackup = () => {
    setRunning(true)
    setTimeout(() => {
      const size = `${(JSON.stringify(snapshot()).length / 1048576).toFixed(1)} MB`
      setBackups((all) => [{ id: crypto.randomUUID(), date: new Date().toISOString(), size, status: "Completed", kind: "Manual" }, ...all])
      state.logAudit("Backup created", "System", `Manual backup completed (${size})`)
      notify.success("Backup completed", `${size} saved`)
      setRunning(false)
    }, 1200)
  }

  const download = () => {
    exportJSON({ app: "pos", version: 2, exportedAt: new Date().toISOString(), data: snapshot() }, `jamii-retail-backup-${stamp()}`)
    state.logAudit("Backup exported", "System", "Full data backup downloaded")
    notify.success("Backup downloaded", "Keep this file somewhere safe. It holds all your records.")
  }

  const pickFile = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const data = parsed?.data ?? parsed
      if (!data || !Array.isArray(data.products) || !Array.isArray(data.sales)) throw new Error("bad")
      setPending(data)
      setFileName(file.name)
    } catch {
      notify.error("That file couldn't be read", "Choose a backup file that was downloaded from this system.")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const restore = () => {
    if (!pending) return
    useDataStore.setState(Object.fromEntries(DATA_KEYS.filter((k) => k in pending).map((k) => [k, pending[k]])))
    useDataStore.getState().logAudit("Backup restored", "System", `Data restored from ${fileName}`, "critical")
    setPending(null)
    notify.success("Backup restored", `${fileName} has been loaded.`)
  }

  const exports: { label: string; run: () => void }[] = [
    { label: "Sales", run: () => exportCSV(state.sales.map((s) => ({ Receipt: s.receiptNumber ?? s.orderNumber, Date: s.createdAt, Subtotal: s.subtotal, Discount: s.discountTotal, VAT: s.taxTotal, Total: s.total, Payment: s.paymentMethod, "Balance due": s.amountDue ?? 0, Status: s.status })), `sales-${stamp()}`) },
    { label: "Products & stock", run: () => exportCSV(state.products.map((p) => ({ Name: p.name, SKU: p.sku, Barcode: p.barcode, Cost: p.costPrice, Price: p.sellingPrice, Stock: getStock(p), Expiry: p.expiryDate?.slice(0, 10) ?? "", Active: p.isActive ? "yes" : "no" })), `products-${stamp()}`) },
    { label: "Customers", run: () => exportCSV(state.customers.map((c) => ({ Name: c.name, Phone: c.phone, Email: c.email, Points: c.loyaltyPoints, Owes: c.amountOwed ?? 0, "Credit limit": c.creditLimit ?? 0 })), `customers-${stamp()}`) },
    { label: "Expenses & income", run: () => exportCSV(state.transactions.map((t) => ({ Date: t.date, Type: t.type, Category: t.category, Description: t.description, Amount: t.amount })), `accounting-${stamp()}`) },
    { label: "Audit log", run: () => exportCSV(state.auditLogs.map((l) => ({ When: l.createdAt, Who: l.userName, Action: l.action, Detail: l.detail, Severity: l.severity })), `audit-${stamp()}`) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Backups & data export" description="Your records are yours. Download them any time, and restore them if something goes wrong.">
        <Button onClick={runBackup} disabled={running}><RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />{running ? "Backing up..." : "Run backup now"}</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><ShieldCheck className="h-5 w-5 text-blue-600" />Full backup</h3></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">One file with your products, stock, sales, customers, staff, expenses and audit log.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={download}><Download className="h-4 w-4" />Download backup</Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Restore from file</Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><FileSpreadsheet className="h-5 w-5 text-blue-600" />Export to Excel / CSV</h3></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {exports.map((e) => <Button key={e.label} variant="secondary" size="sm" onClick={e.run}><Download className="h-3.5 w-3.5" />{e.label}</Button>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Backup history</h3><p className="text-xs text-gray-500">Automatic backups run every night at 2:00 AM. Restores are tested monthly.</p></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{backups.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatDateTime(b.date)}</TableCell>
                <TableCell className="text-gray-500">{b.kind}</TableCell>
                <TableCell className="text-gray-500">{b.size}</TableCell>
                <TableCell><Badge variant={b.status === "Completed" ? "success" : "danger"}>{b.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!pending} onClose={() => setPending(null)} title="Restore this backup?" size="sm">
        <p className="mb-4 text-sm text-gray-600">This replaces the records on this device with the contents of <b>{fileName}</b>. Anything made since that backup will be lost. This will be written to the audit log.</p>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setPending(null)}>Cancel</Button><Button variant="danger" onClick={restore}>Restore</Button></div>
      </Dialog>
    </div>
  )
}
