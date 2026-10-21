import { api } from "@/lib/api/client"
import type { Delivery, DeliveryStatus, Rider, Vehicle } from "@/lib/types"

type Page<T> = { data: T[]; meta: { total: number } }

export const deliveriesApi = {
  list: (query: Record<string, string | number | undefined> = {}) => api<Page<Delivery>>("/deliveries", { query: { limit: 100, ...query } }),
  get: (id: string) => api<Delivery>(`/deliveries/${id}`),
  riders: () => api<Rider[]>("/deliveries/riders"),
  vehicles: () => api<Vehicle[]>("/vehicles"),
  summary: () => api<{
    total: number; open: number; discrepancies: number; byStatus: Record<string, number>
    cod: { owed: number; collected: number }
    riders: { riderId: string; name: string; assigned: number; delivered: number; failed: number; discrepancies: number; avgMinutes: number | null; cod: { owed: number; collected: number } }[]
  }>("/deliveries/summary"),
  create: (body: object) => api<Delivery>("/deliveries", { method: "POST", body }),
  assign: (id: string, body: { riderId: string; vehicleId?: string | null }) => api<Delivery>(`/deliveries/${id}/assign`, { method: "POST", body }),
  load: (id: string, items: { itemId: string; loadedQty: number; reason?: string }[]) => api<Delivery>(`/deliveries/${id}/load`, { method: "POST", body: { items } }),
  start: (id: string) => api<Delivery>(`/deliveries/${id}/start`, { method: "POST" }),
  complete: (id: string, body: { receivedBy: string; items: { itemId: string; deliveredQty: number; reason?: string }[]; codCollected?: number; note?: string }) =>
    api<Delivery>(`/deliveries/${id}/complete`, { method: "POST", body }),
  fail: (id: string, reason: string) => api<Delivery>(`/deliveries/${id}/fail`, { method: "POST", body: { reason } }),
  markReturned: (id: string, note?: string) => api<Delivery>(`/deliveries/${id}/return`, { method: "POST", body: { note } }),
  cancel: (id: string, reason: string) => api<Delivery>(`/deliveries/${id}/cancel`, { method: "POST", body: { reason } }),
}

export const DELIVERY_STATUS: Record<DeliveryStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Not assigned", variant: "default" },
  assigned: { label: "Assigned", variant: "info" },
  loaded: { label: "Loaded", variant: "info" },
  in_transit: { label: "On the way", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  returned: { label: "Returned to depot", variant: "default" },
  cancelled: { label: "Cancelled", variant: "default" },
}

export const OPEN_STATUSES: DeliveryStatus[] = ["pending", "assigned", "loaded", "in_transit"]
