export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")
export const API_BASE = `${API_URL}/api/v1`

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

interface Tokens { accessToken: string | null; refreshToken: string | null }
interface Bridge {
  get: () => Tokens
  set: (accessToken: string, refreshToken: string) => void
  lost: () => void
}

// The auth store registers itself here so this module never imports it (avoids a cycle).
let bridge: Bridge | null = null
export function configureApi(b: Bridge) { bridge = b }

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  idempotencyKey?: string
  /** Skip the Authorization header and the refresh-on-401 behaviour. */
  public?: boolean
  signal?: AbortSignal
  /** Give up after this long and report the server as unreachable. For a till on a slow line, a wait is worse than going offline. */
  timeoutMs?: number
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${API_BASE}${path}`)
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
  return url.toString()
}

// One refresh at a time: the backend rotates refresh tokens and treats a replay as theft.
let refreshing: Promise<boolean> | null = null
async function refreshTokens(): Promise<boolean> {
  const refreshToken = bridge?.get().refreshToken
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { accessToken: string; refreshToken: string }
    bridge?.set(data.accessToken, data.refreshToken)
    return true
  } catch {
    return false
  }
}

async function send(path: string, opts: RequestOptions, isForm: boolean) {
  const headers: Record<string, string> = {}
  if (!isForm && opts.body !== undefined) headers["Content-Type"] = "application/json"
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey
  const token = opts.public ? null : bridge?.get().accessToken
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    signal: opts.timeoutMs ? (opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(opts.timeoutMs)]) : AbortSignal.timeout(opts.timeoutMs)) : opts.signal,
  })
}

async function toError(res: Response): Promise<ApiError> {
  let payload: { error?: { code?: string; message?: string; details?: unknown } } | null = null
  try { payload = await res.json() } catch { /* not JSON */ }
  const e = payload?.error
  // The server already words validation problems as plain sentences ("Business name must be at least 2 characters").
  let message = e?.message ?? (res.status >= 500 ? "Something went wrong on the server. Please try again in a moment." : `Request failed (${res.status})`)
  if (res.status === 413) message = "That file or request is too large."
  return new ApiError(res.status, e?.code ?? "HTTP_ERROR", message, e?.details)
}

async function request(path: string, opts: RequestOptions = {}): Promise<Response> {
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData
  let res: Response
  try {
    res = await send(path, opts, isForm)
  } catch {
    throw new ApiError(0, "NETWORK", "Cannot reach the server. Check your connection and try again.")
  }
  if (res.status === 401 && !opts.public) {
    const code = (await res.clone().json().catch(() => null))?.error?.code as string | undefined
    if (code === "TOKEN_INVALID" || code === "TOKEN_REVOKED" || code === "UNAUTHENTICATED" || !code) {
      refreshing ??= refreshTokens().finally(() => { refreshing = null })
      if (await refreshing) {
        res = await send(path, opts, isForm)
      } else {
        bridge?.lost()
      }
    }
  }
  if (!res.ok) throw await toError(res)
  return res
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await request(path, opts)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function apiBlob(path: string, opts: RequestOptions = {}): Promise<{ blob: Blob; filename?: string }> {
  const res = await request(path, opts)
  const cd = res.headers.get("Content-Disposition") ?? ""
  return { blob: await res.blob(), filename: /filename="?([^";]+)"?/.exec(cd)?.[1] }
}

export interface Page<T> { data: T[]; meta: { page: number; limit: number; total: number; pages: number } }

/** Walks every page of a list endpoint (200 per page), up to `maxPages`. Endpoints that return a plain array (like /staff) come back in one go. */
export async function listAll<T>(path: string, query: RequestOptions["query"] = {}, maxPages = 10): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; page <= maxPages; page++) {
    const res = await api<Page<T> | T[]>(path, { query: { ...query, page, limit: 200 } })
    if (Array.isArray(res)) return res
    out.push(...res.data)
    if (page >= res.meta.pages) break
  }
  return out
}

export const newIdempotencyKey = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)

export function errorMessage(e: unknown, fallback = "Something went wrong") {
  return e instanceof Error ? e.message : fallback
}
