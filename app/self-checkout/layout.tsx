"use client"

import { useInitializeData } from "@/lib/hooks/use-initialize-data"

export default function SelfCheckoutLayout({ children }: { children: React.ReactNode }) {
  useInitializeData()
  return <>{children}</>
}
