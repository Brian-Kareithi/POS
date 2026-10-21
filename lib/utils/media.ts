import { API_URL } from "@/lib/api/client"

/** The server stores uploads under a path like /api/v1/media/...; the browser needs the full address. */
export const mediaUrl = (path?: string | null) => (path ? (/^https?:\/\//.test(path) ? path : `${API_URL}${path}`) : undefined)
