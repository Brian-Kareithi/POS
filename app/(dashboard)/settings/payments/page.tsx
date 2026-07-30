"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export default function PaymentSettingsPage() {
  const methods = [
    { name: "Cash", enabled: true },
    { name: "Card", enabled: true },
    { name: "Bank Transfer", enabled: true },
    { name: "Mobile Money", enabled: true },
  ]

  return (
    <div className="max-w-2xl">
      <PageHeader title="Payment Settings" description="Configure payment methods" />
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead>Enabled</TableHead></TableRow></TableHeader>
        <TableBody>{methods.map((m) => (
          <TableRow key={m.name}>
            <TableCell className="font-medium">{m.name}</TableCell>
            <TableCell><Badge variant={m.enabled ? "success" : "default"}>{m.enabled ? "Active" : "Inactive"}</Badge></TableCell>
            <TableCell><Switch checked={m.enabled} /></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
    </div>
  )
}
