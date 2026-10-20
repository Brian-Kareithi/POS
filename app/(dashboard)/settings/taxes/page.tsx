"use client"

import { useEffect, useState } from "react"
import { api, errorMessage } from "@/lib/api/client"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface Taxes { vatEnabled: boolean; defaultTaxRate: number; pricesIncludeTax: boolean }

export default function TaxSettingsPage() {
  const [taxes, setTaxes] = useState<Taxes | null>(null)
  const [rate, setRate] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<Taxes>("/settings/taxes")
      .then((t) => { setTaxes(t); setRate(String(t.defaultTaxRate)) })
      .catch((e) => setError(errorMessage(e, "Could not load tax settings.")))
  }, [])

  const save = async (changes: Partial<Taxes>) => {
    setSaving(true)
    setError("")
    try {
      const saved = await api<Taxes>("/settings/taxes", { method: "PATCH", body: changes })
      setTaxes(saved)
      setRate(String(saved.defaultTaxRate))
      notify.success("Tax settings saved")
    } catch (e) {
      setError(errorMessage(e, "Could not save."))
    }
    setSaving(false)
  }

  const submitRate = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(rate)
    if (!Number.isFinite(value) || value < 0 || value > 100) return setError("Enter a rate between 0 and 100.")
    void save({ defaultTaxRate: value })
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Tax Settings" description="How VAT is applied to new products" />
      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">VAT</h3></CardHeader>
        <CardContent className="space-y-5">
          {!taxes ? (error ? <p role="alert" className="text-sm text-red-600">{error}</p> : <p role="status" className="text-sm text-gray-500">Loading…</p>) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div><p className="font-medium text-gray-900">Charge VAT</p><p className="text-sm text-gray-500">Each product still carries its own tax rate, which is set on the product.</p></div>
                <Switch checked={taxes.vatEnabled} disabled={saving} onChange={(v: boolean) => save({ vatEnabled: v })} label="Charge VAT" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div><p className="font-medium text-gray-900">Prices already include tax</p><p className="text-sm text-gray-500">Turn on if the prices you enter are what the customer pays.</p></div>
                <Switch checked={taxes.pricesIncludeTax} disabled={saving} onChange={(v: boolean) => save({ pricesIncludeTax: v })} label="Prices include tax" />
              </div>
              <form onSubmit={submitRate} className="flex items-end gap-3">
                <div className="flex-1"><Input label="Default tax rate (%)" type="number" min="0" max="100" step={1} value={rate} onChange={(e) => setRate(e.target.value)} /></div>
                <Button type="submit" isLoading={saving}>Save</Button>
              </form>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
