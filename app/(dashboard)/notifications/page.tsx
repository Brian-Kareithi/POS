"use client"

import { useRouter } from "next/navigation"
import { api, errorMessage } from "@/lib/api/client"
import { notify } from "@/lib/toast"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { notificationsFor } from "@/lib/notifications"
import { ROLE_LABELS } from "@/lib/permissions"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils/format"
import { Bell, CheckCheck } from "lucide-react"

export default function NotificationsPage() {
  const router = useRouter()
  const all = useDataStore((s) => s.notifications)
  const user = useAuthStore((s) => s.user)
  const notifications = notificationsFor(all, user)
  const { reset } = useNotificationStore()

  const markRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: "POST" })
      useDataStore.getState().patch("notifications", id, { read: true })
    } catch (e) { notify.error("Could not mark as read", errorMessage(e)) }
  }

  const open = (n: (typeof notifications)[number]) => {
    if (!n.read) void markRead(n.id)
    // A new access request opens the staff list on its Pending tab.
    if (n.link) router.push(n.link === "/employees" ? "/employees?tab=pending" : n.link)
  }

  const handleMarkAllRead = async () => {
    try {
      await api("/notifications/read-all", { method: "POST" })
      useDataStore.getState().setCollection("notifications", all.map((n) => ({ ...n, read: true })))
      reset()
    } catch (e) { notify.error("Could not mark all as read", errorMessage(e)) }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={`${notifications.filter((n) => !n.read).length} unread${user ? ` · alerts for ${ROLE_LABELS[user.role]}` : ""}`}>
        <Button variant="secondary" onClick={handleMarkAllRead} disabled={notifications.every((n) => n.read)}>
          <CheckCheck className="h-4 w-4" />Mark All Read
        </Button>
      </PageHeader>
      <Card><CardContent className="p-0 divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : notifications.map((n) => (
          <div key={n.id} className={`px-4 sm:px-6 py-4 flex items-start gap-4 ${!n.read ? "bg-blue-50/50" : ""}`}>
            <div className={`flex-1 min-w-0 ${n.link ? "cursor-pointer" : ""}`} onClick={() => n.link && open(n)} role={n.link ? "link" : undefined} tabIndex={n.link ? 0 : undefined} onKeyDown={(e) => { if (n.link && e.key === "Enter") open(n) }}>
              <p className="text-sm font-medium text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={n.type === "success" ? "success" : n.type === "warning" ? "warning" : n.type === "error" ? "danger" : "info"}>{n.type}</Badge>
              {!n.read && (
                <button onClick={() => { void markRead(n.id) }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Mark read</button>
              )}
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  )
}
