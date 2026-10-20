"use client"

import { useState } from "react"
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
import type { Business } from "@/lib/types"

type Form = Pick<Business, "name" | "email" | "phone" | "address" | "currency" | "timezone">

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
    </div>
  )
}
