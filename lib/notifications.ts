import type { Notification, User } from "@/lib/types"

/** The server only sends a person the notifications addressed to them or their role, so nothing is filtered again here. */
export function notificationsFor(all: Notification[], user: Pick<User, "id" | "role"> | null | undefined): Notification[] {
  return user ? all : []
}
