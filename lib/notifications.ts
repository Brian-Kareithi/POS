import type { Notification, Role, User } from "@/lib/types"

const OWNER_MGR: Role[] = ["owner", "manager"]
const STOCK_TEAM: Role[] = ["owner", "manager", "stockkeeper"]
const SALES_TEAM: Role[] = ["owner", "manager", "cashier"]

/** Who should be told about an audit-log entity (stock matters to the stockkeeper, sales to the till, the rest to management). */
export function audienceForEntity(entity: string): Role[] {
  if (/product|stock|purchase|transfer|inventory|warehouse/i.test(entity)) return STOCK_TEAM
  if (/customer|sale|quote|shift/i.test(entity)) return SALES_TEAM
  return OWNER_MGR
}

/** Audience for notifications saved before roles existed, inferred from their wording. */
function legacyAudience(n: Notification): Role[] | null {
  const text = `${n.title} ${n.message}`
  if (/stock|purchase order|transfer|goods received/i.test(text)) return STOCK_TEAM
  if (/self-checkout|quote|payment received|sale/i.test(text)) return SALES_TEAM
  if (/credit|summary|customer/i.test(text)) return OWNER_MGR
  return n.type === "warning" || n.type === "error" ? OWNER_MGR : null
}

/** A notification is shown to the roles it lists; one aimed at a single user goes only to them; the rest go to everyone. */
export function isVisibleTo(n: Notification, user: Pick<User, "id" | "role"> | null | undefined): boolean {
  if (!user) return false
  if (n.roles) return n.roles.includes(user.role)
  const legacy = legacyAudience(n)
  if (legacy) return legacy.includes(user.role)
  return !n.userId || n.userId === user.id
}

export function notificationsFor(all: Notification[], user: Pick<User, "id" | "role"> | null | undefined): Notification[] {
  return all.filter((n) => isVisibleTo(n, user))
}
