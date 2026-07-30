"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

export default function TaxSettingsPage() {
  const [taxes] = useState([
    { name: "Standard VAT", rate: 16, isActive: true },
    { name: "Sales Tax", rate: 8, isActive: true },
    { name: "Zero Rated", rate: 0, isActive: true },
  ])

  return (
    <div className="max-w-2xl">
      <PageHeader title="Tax Settings" description="Configure tax rates">
        <Button><Plus className="h-4 w-4" />Add Tax Rate</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{taxes.map((t, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{t.name}</TableCell>
            <TableCell>{t.rate}%</TableCell>
            <TableCell><Badge variant={t.isActive ? "success" : "default"}>{t.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
    </div>
  )
}
