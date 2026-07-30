"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils/format"
import { Download, RefreshCw } from "lucide-react"

export default function BackupSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Backup Settings" description="Manage automated backups">
        <Button><RefreshCw className="h-4 w-4" />Run Backup Now</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Size</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          <TableRow><TableCell className="text-gray-500" colSpan={4}>No backups yet. Configure daily backups below.</TableCell></TableRow>
        </TableBody></Table>
      </CardContent></Card>
    </div>
  )
}
