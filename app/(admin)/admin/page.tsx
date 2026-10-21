"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Building2, PauseCircle, UserPlus, Users } from "lucide-react"
import { adminApi, STATUS_LABELS, STATUS_VARIANT, type AdminBusinessRow, type AdminOverview } from "@/lib/api/admin"
import { errorMessage } from "@/lib/api/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/skeleton"

/** Two across on every screen (a 2x2 block), four across only on very wide ones. */
function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: number | string; hint?: string }) {
  return (
    <Card className="min-w-0 rounded-2xl">
      <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 sm:h-11 sm:w-11"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
          <p className="truncate text-xs text-gray-500 sm:text-sm">{label}</p>
          {hint && <p className="truncate text-[11px] text-gray-400 sm:text-xs">{hint}</p>}
        </div>
      </div>
    </Card>
  )
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [recent, setRecent] = useState<AdminBusinessRow[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let live = true
    Promise.all([adminApi.overview(), adminApi.businesses({ limit: 8 })])
      .then(([o, b]) => { if (live) { setOverview(o); setRecent(b.data) } })
      .catch((e) => { if (live) setError(errorMessage(e, "Could not load the overview.")) })
    return () => { live = false }
  }, [])

  return (
    <div className="min-w-0">
      <PageHeader title="Overview" description="Every business on the platform, at a glance" />
      {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!overview && !error && <DashboardSkeleton />}
      {overview && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Stat icon={Building2} label="Businesses" value={overview.businesses.total} hint={`${overview.businesses.active} active`} />
            <Stat icon={PauseCircle} label="Suspended / closed" value={overview.businesses.suspended + overview.businesses.closed} hint={`${overview.businesses.suspended} suspended, ${overview.businesses.closed} closed`} />
            <Stat icon={Users} label="People" value={overview.users} hint="with accounts" />
            <Stat icon={UserPlus} label="New in 7 days" value={overview.newBusinesses.last7Days} hint={`${overview.newBusinesses.last30Days} in 30 days`} />
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-gray-600"><Activity className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><span>{overview.businessesActiveLast7Days} {overview.businessesActiveLast7Days === 1 ? "business has" : "businesses have"} had someone active in the last 7 days.</span></p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="min-w-0 overflow-hidden rounded-2xl">
              <CardHeader className="flex items-center justify-between gap-2"><h2 className="font-semibold text-gray-900">Newest businesses</h2><Link href="/admin/businesses" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">See all</Link></CardHeader>
              <ul className="divide-y divide-gray-100">
                {recent.map((b) => (
                  <li key={b.id}>
                    <Link href={`/admin/businesses/${b.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 sm:px-6">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">{b.name}</span>
                        <span className="block truncate text-xs text-gray-500">{b.owner ? b.owner.email : "No owner"}</span>
                        <span className="block truncate text-xs text-gray-400">{b.owner?.name ? `${b.owner.name} · ` : ""}{b.industryLabel}</span>
                      </span>
                      <Badge variant={STATUS_VARIANT[b.status]} className="shrink-0">{STATUS_LABELS[b.status]}</Badge>
                    </Link>
                  </li>
                ))}
                {recent.length === 0 && <li className="px-6 py-8 text-center text-sm text-gray-500">No businesses have signed up yet.</li>}
              </ul>
            </Card>
            <Card className="min-w-0 overflow-hidden rounded-2xl">
              <CardHeader><h2 className="font-semibold text-gray-900">By industry</h2></CardHeader>
              <ul className="divide-y divide-gray-100">
                {overview.byIndustry.map((i) => (
                  <li key={i.industry} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-6"><span className="min-w-0 truncate text-gray-700">{i.label}</span><span className="shrink-0 font-semibold text-gray-900">{i.count}</span></li>
                ))}
                {overview.byIndustry.length === 0 && <li className="px-6 py-6 text-sm text-gray-500">Nothing yet.</li>}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
