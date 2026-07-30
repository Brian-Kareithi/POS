"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ROLES } from "@/lib/constants"
import { Plus } from "lucide-react"

export default function UserManagementPage() {
  const { users } = useDataStore()
  const getRole = (r: string) => ROLES.find((rl) => rl.value === r)?.label || r

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage users and permissions">
        <Button><Plus className="h-4 w-4" />Invite User</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Verified</TableHead><TableHead>2FA</TableHead></TableRow></TableHeader>
        <TableBody>{users.map((u) => (
          <TableRow key={u.id}>
            <TableCell className="font-medium">{u.name}</TableCell>
            <TableCell className="text-gray-500">{u.email}</TableCell>
            <TableCell><Badge>{getRole(u.role)}</Badge></TableCell>
            <TableCell><Badge variant={u.emailVerified ? "success" : "warning"}>{u.emailVerified ? "Yes" : "No"}</Badge></TableCell>
            <TableCell><Badge variant={u.twoFactorEnabled ? "success" : "default"}>{u.twoFactorEnabled ? "On" : "Off"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>
    </div>
  )
}
