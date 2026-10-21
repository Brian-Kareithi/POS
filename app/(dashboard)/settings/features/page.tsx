"use client"

import { ListSkeleton } from "@/components/ui/skeleton"
import { useCallback, useEffect, useMemo, useState } from "react"
import { api, errorMessage } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, Lock } from "lucide-react"
import type { IndustryConfig, ModuleId } from "@/lib/types"

interface Feature { id: ModuleId; label: string; summary: string; benefit: string; locked: boolean; hidden: boolean }
interface FeatureList { industry: string; industryLabel: string; features: Feature[] }

/** The owner decides which tabs their business shows. Hiding a tab removes it for everyone; nothing is deleted. */
export default function FeaturesPage() {
  const isOwner = useAuthStore((s) => s.user?.role === "owner")
  const [data, setData] = useState<FeatureList | null>(null)
  const [hidden, setHidden] = useState<ModuleId[]>([])
  const [saved, setSaved] = useState<ModuleId[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError("")
    try {
      const res = await api<FeatureList>("/settings/features")
      const h = res.features.filter((f) => f.hidden).map((f) => f.id)
      setData(res); setHidden(h); setSaved(h)
    } catch (e) {
      setError(errorMessage(e, "Could not load your features."))
    }
  }, [])
  useEffect(() => { if (isOwner) void load() }, [isOwner, load])

  const dirty = useMemo(() => hidden.length !== saved.length || hidden.some((h) => !saved.includes(h)), [hidden, saved])
  const toggle = (id: ModuleId, on: boolean) => setHidden((h) => (on ? h.filter((x) => x !== id) : [...h, id]))

  const save = async () => {
    setBusy(true); setError("")
    try {
      await api("/settings/features", { method: "PATCH", body: { hidden } })
      useDataStore.getState().setIndustry(await api<IndustryConfig>("/industry"))
      setSaved(hidden)
      notify.success("Features updated", hidden.length ? `${hidden.length} hidden` : "Everything is showing")
    } catch (e) {
      setError(errorMessage(e, "Could not save your changes."))
    } finally {
      setBusy(false)
    }
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Features" description="Choose which tabs your business uses" />
        <p role="alert" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Only the business owner can change which features are on.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Features" description={data ? `Tabs available to a ${data.industryLabel} business. Switch off the ones you don't need.` : "Choose which tabs your business uses"}>
        <Button onClick={save} isLoading={busy} disabled={!dirty} className="rounded-full">Save changes</Button>
      </PageHeader>
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} <button className="font-semibold underline" onClick={() => void load()}>Try again</button>
        </p>
      )}
      {!data && !error && <ListSkeleton rows={6} />}
      <div className="space-y-3">
        {data?.features.map((f) => {
          const on = !hidden.includes(f.id)
          return (
            <Card key={f.id} className="rounded-2xl">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{f.label}</h3>
                    {f.locked && <Badge variant="info"><Lock className="mr-1 h-3 w-3" />Always on</Badge>}
                    {!on && <Badge variant="warning">Hidden</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{f.summary}</p>
                  <p className="mt-2 flex gap-1.5 text-xs text-gray-500"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /><span><span className="font-medium text-gray-700">How it helps:</span> {f.benefit}</span></p>
                </div>
                <Switch checked={on} disabled={f.locked} onChange={(v) => toggle(f.id, v)} aria-label={`${on ? "Hide" : "Show"} ${f.label}`} />
              </CardContent>
            </Card>
          )
        })}
      </div>
      {data && <p className="mt-4 text-xs text-gray-500">Hiding a tab removes it for everyone in your business. Your data is kept, and you can switch it back on at any time.</p>}
    </div>
  )
}
