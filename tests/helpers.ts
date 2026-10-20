import { vi } from "vitest"

type Handler = (url: URL, init: RequestInit) => { status?: number; body?: unknown } | Promise<{ status?: number; body?: unknown }>

export interface Call { method: string; path: string; body: unknown; headers: Record<string, string> }

/** Replaces fetch with a tiny fake of the POS API. Paths are matched without the /api/v1 prefix. */
export function mockApi(routes: Record<string, Handler>) {
  const calls: Call[] = []
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input))
    const path = url.pathname.replace(/^\/api\/v1/, "")
    const method = (init.method ?? "GET").toUpperCase()
    calls.push({ method, path, body: init.body ? JSON.parse(String(init.body)) : undefined, headers: (init.headers ?? {}) as Record<string, string> })
    const handler = routes[`${method} ${path}`]
    if (!handler) return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: `No mock for ${method} ${path}` } }), { status: 404 })
    const { status = 200, body } = await handler(url, init)
    return new Response(status === 204 ? null : JSON.stringify(body ?? {}), { status, headers: { "Content-Type": "application/json" } })
  }))
  return calls
}

export const apiError = (status: number, code: string, message = code) => ({ status, body: { error: { code, message } } })
