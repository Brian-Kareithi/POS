import type { Metadata } from "next"
import { APP_NAME } from "@/lib/constants"
import { DashboardShell } from "./dashboard-shell"

export const metadata: Metadata = {
  title: APP_NAME,
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
