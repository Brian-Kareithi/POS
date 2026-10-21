"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useEffect, useRef, useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDataStore } from "@/lib/stores/data-store"
import { api, apiBlob, errorMessage } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { notify } from "@/lib/toast"
import { exportCSV } from "@/lib/utils/export"
import { formatDateTime } from "@/lib/utils/format"
import { getStock } from "@/lib/utils/stock"
import { Download, RefreshCw, Upload, ShieldCheck, FileSpreadsheet } from "lucide-react"

interface Snapshot { id: string; key: string; sizeBytes: number; createdAt: string }
const size = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

export default function BackupSettingsPage() {
  const state = useDataStore()
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null)
  const [loadError, setLoadError] = useState("")
  const [running, setRunning] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [totp, setTotp] = useState("")
  const [confirm, setConfirm] = useState("")
  const [restoreError, setRestoreError] = useState("")
  const [restoring, setRestoring] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const stamp = () => new Date().toISOString().slice(0, 10)
  const slug = state.business?.slug ?? ""

  const load = useCallback(async () => {
    try { setSnapshots(await api<Snapshot[]>("/backup/snapshots")) } catch (e) { setLoadError(errorMessage(e, "Could not load backups.")) }
  }, [])
  useEffect(() => { void load() }, [load])

  const runBackup = async () => {
    setRunning(true)
    try {
      const rec = await api<Snapshot>("/backup/snapshots", { method: "POST" })
      notify.success("Backup completed", size(rec.sizeBytes))
      await load()
    } catch (e) {
      notify.error("Backup failed", errorMessage(e))
    }
    setRunning(false)
  }

  const download = async () => {
    try {
      const { blob, filename } = await apiBlob("/backup/export")
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename ?? `backup-${stamp()}.json`
      a.click()
      URL.revokeObjectURL(url)
      notify.success("Backup downloaded", "Keep this file somewhere safe. It holds all your records.")
    } catch (e) {
      notify.error("Could not download the backup", errorMessage(e))
    }
  }

  const closeRestore = () => { setFile(null); setPassword(""); setTotp(""); setConfirm(""); setRestoreError(""); if (fileRef.current) fileRef.current.value = "" }

  const restore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setRestoring(true)
    setRestoreError("")
    try {
      const form = new FormData()
      form.append("password", password)
      form.append("confirm", confirm)
      if (totp) form.append("totpCode", totp)
      form.append("file", file)
      await api("/backup/restore", { method: "POST", body: form })
      notify.success("Backup restored", `${file.name} has been loaded.`)
      closeRestore()
      // Everything on screen came from the old data: sign in again to start clean.
      void useAuthStore.getState().logout().then(() => { window.location.href = "/login" })
    } catch (err) {
      setRestoreError(errorMessage(err, "Could not restore that backup."))
    }
    setRestoring(false)
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
            <p className="text-sm text-gray-500">One file with your products, stock, sales, customers, expenses and settings. Staff accounts, passwords and the audit log are never included.</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={download}><Download className="h-4 w-4" />Download backup</Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Restore from file</Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
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
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Backup history</h3><p className="text-xs text-gray-500">Snapshots saved to the server&apos;s storage. Automatic ones run on the schedule your server is set up with.</p></CardHeader>
        <CardContent className="p-0">
          <Table scroll>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Size</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{!snapshots ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-gray-500">{loadError || <Skeleton className="mx-auto h-4 w-48" />}</TableCell></TableRow>
            ) : snapshots.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-gray-500">No snapshots yet.</TableCell></TableRow>
            ) : snapshots.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{formatDateTime(b.createdAt)}</TableCell>
                <TableCell className="text-gray-500">{size(b.sizeBytes)}</TableCell>
                <TableCell><Badge variant="success">Saved</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!file} onClose={() => !restoring && closeRestore()} title="Restore this backup?" size="sm">
        <form onSubmit={restore} className="space-y-4">
          <p className="text-sm text-gray-600">This replaces your business data with the contents of <b>{file?.name}</b>. Anything made since that backup will be lost, and the server writes this to the audit log. You will be signed out afterwards.</p>
          <Input label="Your password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Two-factor code (if you use one)" inputMode="numeric" maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value)} />
          <Input label={`Type RESTORE ${slug} to confirm`} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {restoreError && <p role="alert" className="text-sm text-red-600">{restoreError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={restoring} onClick={closeRestore}>Cancel</Button>
            <Button type="submit" variant="danger" isLoading={restoring} disabled={!password || confirm !== `RESTORE ${slug}`}>Restore</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
