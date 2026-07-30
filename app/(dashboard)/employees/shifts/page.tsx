"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock } from "lucide-react"

export default function ShiftsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Shift Management" description="Track employee shifts and attendance">
        <Button><Clock className="h-4 w-4" />Clock In/Out</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No shifts recorded yet.</TableCell></TableRow>
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
