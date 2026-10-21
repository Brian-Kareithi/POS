import type { Metadata } from "next"
import { APP_NAME } from "@/lib/constants"
import { AdminShell } from "./admin-shell"

export const metadata: Metadata = { title: `Super admin - ${APP_NAME}` }

export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
