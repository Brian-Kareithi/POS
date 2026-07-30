"use client"

import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Package, Users, UserCircle, Percent, TrendingUp } from "lucide-react"

const reportTypes = [
  { href: "/reports/sales", label: "Sales Reports", desc: "View sales performance and trends", icon: BarChart3 },
  { href: "/reports/inventory", label: "Inventory Reports", desc: "Stock levels and movement", icon: Package },
  { href: "/reports/staff", label: "Staff Reports", desc: "Employee performance metrics", icon: UserCircle },
  { href: "/reports/customers", label: "Customer Reports", desc: "Customer analytics and behavior", icon: Users },
  { href: "/reports/taxes", label: "Tax Reports", desc: "Tax collection summaries", icon: Percent },
  { href: "/reports/profit", label: "Profit Reports", desc: "Profitability analysis", icon: TrendingUp },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate and view business reports" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="rounded-lg bg-gray-50 p-3"><r.icon className="h-6 w-6 text-gray-600" /></div>
                <div><h3 className="font-semibold text-gray-900">{r.label}</h3><p className="text-sm text-gray-500 mt-0.5">{r.desc}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
