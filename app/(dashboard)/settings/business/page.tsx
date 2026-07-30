"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useForm } from "react-hook-form"
import { CURRENCIES } from "@/lib/constants"
import { useState } from "react"

export default function BusinessSettingsPage() {
  const { business, setBusiness } = useDataStore()
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit } = useForm({ defaultValues: business || {} })

  const onSubmit = (data: any) => {
    setBusiness({ ...business!, ...data })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            <div className="grid grid-cols-2 gap-4">
              <Select label="Currency" options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))} {...register("currency")} />
              <Input label="Timezone" {...register("timezone")} />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit">{saved ? "Saved!" : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
