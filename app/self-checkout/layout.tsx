"use client"

import { DashboardSkeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useSyncExternalStore } from "react"
import { useInitializeData } from "@/lib/hooks/use-initialize-data"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/** The kiosk reads the product list, so a member of staff signs in on the device first. Shoppers never see staff screens. */
export default function SelfCheckoutLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loaded = useDataStore((s) => s.loaded)
  const ready = useSyncExternalStore(
    (cb) => useAuthStore.persist.onFinishHydration(cb),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  )
  useInitializeData(ready && isAuthenticated)

  let body = children
  if (!ready || (isAuthenticated && !loaded)) {
    body = <div className="min-h-dvh bg-gray-50 p-4"><DashboardSkeleton /></div>
  } else if (!isAuthenticated) {
    body = (
      <div className="grid min-h-dvh place-items-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10">
            <h1 className="mb-2 text-xl font-semibold text-gray-900">Self checkout is not started</h1>
            <p className="mb-6 text-sm text-gray-500">A member of staff needs to sign in on this device first.</p>
            <Link href="/login"><Button>Staff sign in</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <ThemeToggle className="fixed right-3 top-3 z-30" />
      {body}
    </>
  )
}
