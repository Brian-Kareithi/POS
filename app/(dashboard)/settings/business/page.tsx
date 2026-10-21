"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useDataStore } from "@/lib/stores/data-store"
import { api, errorMessage } from "@/lib/api/client"
import { toBusiness } from "@/lib/api/mappers"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CURRENCIES } from "@/lib/constants"
import type { Business, Industry, IndustryConfig, IndustryOption } from "@/lib/types"

type Form = Pick<Business, "name" | "email" | "phone" | "address" | "currency" | "timezone">

/** The kind of business decides the portal's tabs and staff roles. Changing it is allowed, but not while staff hold roles the new kind lacks. */
function IndustryCard() {
  const business = useDataStore((s) => s.business)
  const current = useDataStore((s) => s.industry)
  const [options, setOptions] = useState<IndustryOption[]>([])
  const [value, setValue] = useState<Industry | "">(business?.industry ?? current?.industry ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => { api<IndustryOption[]>("/industries", { public: true }).then(setOptions).catch(() => setOptions([])) }, [])
  const chosen = options.find((o) => o.id === value)
  const changed = !!value && value !== (business?.industry ?? current?.industry)

  const save = async () => {
    if (!window.confirm("Change the kind of business? Your tabs and the staff roles you can hand out will change. Existing data is kept.")) return
    setBusy(true)
    setError("")
    try {
      const saved = toBusiness(await api("/business", { method: "PATCH", body: { industry: value } }))
      useDataStore.getState().setBusiness(saved)
      useDataStore.getState().setIndustry(await api<IndustryConfig>("/industry"))
      notify.success("Business type updated", chosen?.label)
    } catch (e) {
      setError(errorMessage(e, "Could not change the business type."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader><h3 className="text-lg font-semibold text-gray-900">Kind of business</h3><p className="text-xs text-gray-500">Sets your tabs, staff roles and the words used across the portal.</p></CardHeader>
      <CardContent className="space-y-3">
        <Select label="Industry" options={options.map((o) => ({ value: o.id, label: o.label }))} value={value} onChange={(e) => setValue(e.target.value as Industry)} />
        {chosen && <p className="text-xs text-gray-500">{chosen.description}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button onClick={save} disabled={!changed} isLoading={busy}>Change business type</Button>
      </CardContent>
    </Card>
  )
}

export default function BusinessSettingsPage() {
  const business = useDataStore((s) => s.business)
  const [error, setError] = useState("")
  const { register, handleSubmit, formState: { isSubmitting, isSubmitSuccessful } } = useForm<Form>({ defaultValues: business ?? {} })

  const onSubmit = async (data: Form) => {
    setError("")
    try {
      // Blank optional fields are cleared on the server rather than saved as empty text.
      const saved = toBusiness(await api("/business", {
        method: "PATCH",
        body: { name: data.name, email: data.email || null, phone: data.phone || null, address: data.address || null, currency: data.currency, timezone: data.timezone },
      }))
      useDataStore.getState().setBusiness(saved)
      notify.success("Business details saved")
    } catch (e) {
      setError(errorMessage(e, "Could not save your changes."))
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Business Settings" description="Manage your business information" />
      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Company Information</h3></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Business Name" {...register("name")} />
            <Input label="Email" type="email" {...register("email")} />
            <Input label="Phone" {...register("phone")} />
            <Input label="Address" {...register("address")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Currency" options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))} {...register("currency")} />
              <Input label="Timezone" {...register("timezone")} />
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" isLoading={isSubmitting}>{isSubmitSuccessful && !error ? "Saved!" : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <IndustryCard />
    </div>
  )
}
