"use client"

import { ListSkeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"
import { api, errorMessage } from "@/lib/api/client"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

type Methods = { cash: boolean; card: boolean; bank_transfer: boolean; mobile_money: boolean; credit: boolean }
const LABELS: Record<keyof Methods, string> = {
  cash: "Cash", card: "Card", bank_transfer: "Bank Transfer", mobile_money: "Mobile Money (M-Pesa)", credit: "Customer credit (pay later)",
}

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<Methods | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState<keyof Methods | null>(null)

  useEffect(() => {
    api<Methods>("/settings/payment-methods").then(setMethods).catch((e) => setError(errorMessage(e, "Could not load payment settings.")))
  }, [])

  const toggle = async (key: keyof Methods, enabled: boolean) => {
    setSaving(key)
    try {
      setMethods(await api<Methods>("/settings/payment-methods", { method: "PATCH", body: { [key]: enabled } }))
    } catch (e) {
      notify.error("Could not save", errorMessage(e))
    }
    setSaving(null)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Payment Settings" description="Choose which payment methods the till accepts" />
      <Card><CardContent className="p-0">
        {error ? <p role="alert" className="p-6 text-sm text-red-600">{error}</p> : !methods ? <ListSkeleton rows={3} bordered={false} /> : (
          <Table><TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Enabled</TableHead></TableRow></TableHeader>
          <TableBody>{(Object.keys(LABELS) as (keyof Methods)[]).map((key) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{LABELS[key]}</TableCell>
              <TableCell><Badge variant={methods[key] ? "success" : "default"}>{methods[key] ? "Active" : "Inactive"}</Badge></TableCell>
              <TableCell><Switch checked={methods[key]} disabled={saving === key} onChange={(v: boolean) => toggle(key, v)} label={`${LABELS[key]} enabled`} /></TableCell>
            </TableRow>
          ))}</TableBody></Table>
        )}
      </CardContent></Card>
    </div>
  )
}
