"use client"

import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building2, Percent, Printer, CreditCard, Users,
  HardDrive, Key, Plug, LayoutGrid
} from "lucide-react"

const settingsItems: { href: string; label: string; desc: string; icon: typeof Building2; ownerOnly?: boolean }[] = [
  { href: "/settings/business", label: "Business Settings", desc: "Company info, currency, timezone", icon: Building2 },
  { href: "/settings/features", label: "Features & tabs", desc: "Hide tabs you don't need, see how each one helps", icon: LayoutGrid, ownerOnly: true },
  { href: "/settings/taxes", label: "Tax Settings", desc: "Configure tax rates and rules", icon: Percent },
  { href: "/settings/receipts", label: "Receipt Settings", desc: "Customize receipt templates", icon: Printer },
  { href: "/settings/payments", label: "Payment Settings", desc: "Payment method configuration", icon: CreditCard },
  { href: "/employees", label: "Staff & permissions", desc: "Roles, branches and who can do what", icon: Users },
  { href: "/settings/integrations", label: "Integrations", desc: "M-Pesa, eTIMS, printers and scanners", icon: Plug },
  { href: "/settings/backups", label: "Backups & data export", desc: "Download, restore and export your data", icon: HardDrive },
  { href: "/settings/api-keys", label: "API Keys", desc: "Manage API integrations", icon: Key },
]

export default function SettingsPage() {
  const isOwner = useAuthStore((s) => s.user?.role === "owner")
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your system" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.filter((i) => !i.ownerOnly || isOwner).map((item) => (
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
