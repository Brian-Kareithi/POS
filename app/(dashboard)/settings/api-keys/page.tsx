"use client"

import { useCallback, useEffect, useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Plus, Copy } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { api, errorMessage } from "@/lib/api/client"
import { notify } from "@/lib/toast"

const SCOPES = [
  { id: "products:read", label: "Read products" },
  { id: "inventory:read", label: "Read stock levels" },
  { id: "sales:read", label: "Read sales" },
] as const

const schema = z.object({ name: z.string().trim().min(1, "Give the key a name").max(100) })

interface Key { id: string; name: string; keyPrefix: string; scopes: string[]; lastUsed: string | null; isActive: boolean; createdAt: string }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<Key[] | null>(null)
  const [loadError, setLoadError] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [scopes, setScopes] = useState<string[]>(["products:read"])
  const [newKey, setNewKey] = useState("")
  const [error, setError] = useState("")
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const load = useCallback(async () => {
    try { setKeys(await api<Key[]>("/api-keys")) } catch (e) { setLoadError(errorMessage(e, "Could not load API keys.")) }
  }, [])
  useEffect(() => { void load() }, [load])

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setError("")
    if (scopes.length === 0) return setError("Choose at least one thing the key may read.")
    try {
      const created = await api<{ key: string }>("/api-keys", { method: "POST", body: { name: data.name, scopes } })
      setNewKey(created.key)
      reset()
      await load()
    } catch (e) {
      setError(errorMessage(e, "Could not create the key."))
    }
  }

  const revoke = async (id: string) => {
    try { await api(`/api-keys/${id}`, { method: "DELETE" }); await load() } catch (e) { notify.error("Could not revoke the key", errorMessage(e)) }
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); notify.success("Copied") } catch { notify.error("Could not copy") }
  }

  const close = () => { setShowModal(false); setNewKey(""); setError("") }

  return (
    <div className="space-y-6">
      <PageHeader title="API Keys" description="Read-only keys for connecting other systems to your data">
        <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" />Generate Key</Button>
      </PageHeader>
      <Card><CardContent className="p-0">
        <Table scroll><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Key</TableHead><TableHead>Can read</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>{!keys ? (
          <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">{loadError || "Loading…"}</TableCell></TableRow>
        ) : keys.length === 0 ? (
          <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No API keys generated yet.</TableCell></TableRow>
        ) : keys.map((k) => (
          <TableRow key={k.id}>
            <TableCell className="font-medium">{k.name}</TableCell>
            <TableCell className="font-mono text-xs">{k.keyPrefix}…</TableCell>
            <TableCell className="text-gray-500 text-xs">{k.scopes.join(", ")}</TableCell>
            <TableCell className="text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</TableCell>
            <TableCell><Badge variant={k.isActive ? "success" : "default"}>{k.isActive ? "Active" : "Revoked"}</Badge></TableCell>
            <TableCell>{k.isActive && <button onClick={() => revoke(k.id)} className="text-xs text-red-600 hover:underline">Revoke</button>}</TableCell>
          </TableRow>
        ))}</TableBody></Table>
      </CardContent></Card>

      <Dialog open={showModal} onClose={close} title={newKey ? "API Key Generated" : "Generate API Key"} size="sm">
        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs font-mono break-all text-gray-900">{newKey}</p></div>
            <p className="text-sm text-orange-600 font-medium">Copy this key now. You won&apos;t be able to see it again.</p>
            <Button className="w-full" onClick={() => copy(newKey)}><Copy className="h-4 w-4" />Copy Key</Button>
            <Button variant="secondary" className="w-full" onClick={close}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Key Name" placeholder="e.g., Online store sync" error={errors.name?.message as string} {...register("name")} />
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">What can it read?</legend>
              {SCOPES.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={scopes.includes(s.id)} onChange={(e) => setScopes((all) => (e.target.checked ? [...all, s.id] : all.filter((x) => x !== s.id)))} />
                  {s.label}
                </label>
              ))}
            </fieldset>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit" isLoading={isSubmitting}>Generate</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
