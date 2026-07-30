"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const labelMap: Record<string, string> = {
  "": "Dashboard",
  "products": "Products",
  "categories": "Categories",
  "brands": "Brands",
  "suppliers": "Suppliers",
  "new": "New",
  "inventory": "Inventory",
  "warehouses": "Warehouses",
  "transfers": "Transfers",
  "purchase-orders": "Purchase Orders",
  "adjustments": "Adjustments",
  "sales": "Sales",
  "returns": "Returns",
  "quotes": "Quotes",
  "customers": "Customers",
  "groups": "Groups",
  "employees": "Employees",
  "shifts": "Shifts",
  "accounting": "Accounting",
  "reports": "Reports",
  "settings": "Settings",
  "business": "Business",
  "taxes": "Taxes",
  "receipts": "Receipts",
  "payments": "Payments",
  "users": "Users",
  "backups": "Backups",
  "api-keys": "API Keys",
  "notifications": "Notifications",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean).filter(s => !s.startsWith("(") && !s.startsWith("["))

  if (segments.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
      <Link href="/" className="hover:text-gray-700">
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/")
        const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
        const isLast = index === segments.length - 1

        return (
          <div key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="h-4 w-4 text-gray-300" />
            {isLast ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-gray-700">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
