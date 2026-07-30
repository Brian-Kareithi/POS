"use client"

import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building2, Percent, Printer, CreditCard, Users,
  HardDrive, Key, Bell
} from "lucide-react"

const settingsItems = [
  { href: "/settings/business", label: "Business Settings", desc: "Company info, currency, timezone", icon: Building2 },
  { href: "/settings/taxes", label: "Tax Settings", desc: "Configure tax rates and rules", icon: Percent },
  { href: "/settings/receipts", label: "Receipt Settings", desc: "Customize receipt templates", icon: Printer },
  { href: "/settings/payments", label: "Payment Settings", desc: "Payment method configuration", icon: CreditCard },
  { href: "/settings/users", label: "User Management", desc: "Manage users and permissions", icon: Users },
  { href: "/settings/backups", label: "Backup Settings", desc: "Configure automated backups", icon: HardDrive },
  { href: "/settings/api-keys", label: "API Keys", desc: "Manage API integrations", icon: Key },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your system" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="rounded-lg bg-gray-50 p-3"><item.icon className="h-6 w-6 text-gray-600" /></div>
                <div><h3 className="font-semibold text-gray-900">{item.label}</h3><p className="text-sm text-gray-500 mt-0.5">{item.desc}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
