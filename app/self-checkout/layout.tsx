"use client"

import { useInitializeData } from "@/lib/hooks/use-initialize-data"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function SelfCheckoutLayout({ children }: { children: React.ReactNode }) {
  useInitializeData()
  return (
    <>
      <ThemeToggle className="fixed right-3 top-3 z-30" />
      {children}
    </>
  )
}
