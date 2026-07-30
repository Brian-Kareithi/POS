"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Plus, Copy, Key } from "lucide-react"
import { generateId } from "@/lib/utils/generators"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

const schema = z.object({ name: z.string().min(1) })

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<{ id: string; name: string; key: string; createdAt: string; isActive: boolean }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newKey, setNewKey] = useState("")
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: any) => {
    const generated = `pos_${generateId().replace(/-/g, "")}`
    setKeys([...keys, { id: generateId(), name: data.name, key: generated, createdAt: new Date().toISOString(), isActive: true }])
    setNewKey(generated)
    reset()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="API Keys" description="Manage API integrations">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Generate Key</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{keys.length === 0 ? (
          <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No API keys generated yet.</TableCell></TableRow>
        ) : keys.map((k) => (
          <TableRow key={k.id}>
            <TableCell className="font-medium">{k.name}</TableCell>
            <TableCell className="font-mono text-xs">{k.key.substring(0, 16)}... <button onClick={() => navigator.clipboard.writeText(k.key)} className="text-blue-600 hover:text-blue-700 ml-1"><Copy className="h-3 w-3 inline" /></button></TableCell>
            <TableCell className="text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
            <TableCell><Badge variant={k.isActive ? "success" : "default"}>{k.isActive ? "Active" : "Inactive"}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>

      <Dialog open={showModal} onClose={() => { setShowModal(false); setNewKey("") }} title={newKey ? "API Key Generated" : "Generate API Key"} size="sm">
        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-mono break-all text-gray-900">{newKey}</p>
            </div>
            <p className="text-sm text-orange-600 font-medium">Copy this key now. You won't be able to see it again.</p>
            <Button className="w-full" onClick={() => navigator.clipboard.writeText(newKey)}><Copy className="h-4 w-4" />Copy Key</Button>
            <Button variant="secondary" className="w-full" onClick={() => { setShowModal(false); setNewKey("") }}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Key Name" placeholder="e.g., Production API" error={errors.name?.message as string} {...register("name")} />
            <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">Generate</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
