"use client"

import { useDataStore } from "@/lib/stores/data-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils/format"
import { Bell, CheckCheck } from "lucide-react"

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useDataStore()
  const { reset } = useNotificationStore()

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
    reset()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={`${notifications.filter((n) => !n.read).length} unread`}>
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
          <div key={n.id} className={`px-6 py-4 flex items-start gap-4 ${!n.read ? "bg-blue-50/50" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={n.type === "success" ? "success" : n.type === "warning" ? "warning" : n.type === "error" ? "danger" : "info"}>{n.type}</Badge>
              {!n.read && (
                <button onClick={() => { markNotificationRead(n.id); useNotificationStore.getState().decrement() }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Mark read</button>
              )}
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  )
}
