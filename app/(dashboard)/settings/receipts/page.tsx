"use client"

import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ReceiptSettingsPage() {
  const [saved, setSaved] = useState(false)
  return (
    <div className="max-w-2xl">
      <PageHeader title="Receipt Settings" description="Customize your receipt templates" />
      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-gray-900">Receipt Template</h3></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Header Text" defaultValue="Thank you for shopping!" />
          <Input label="Footer Text" defaultValue="Please come again" />
          <Textarea label="Terms & Conditions" defaultValue="No refunds after 30 days." />
          <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}>{saved ? "Saved!" : "Save Changes"}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
