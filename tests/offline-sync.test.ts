import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/api/client", async (orig) => {
  const real = await orig<typeof import("@/lib/api/client")>()
  return { ...real, api: vi.fn() }
})
vi.mock("@/lib/toast", () => ({ notify: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }))
vi.mock("@/lib/api/sync", () => ({
  refresh: { sales: vi.fn().mockResolvedValue(undefined), products: vi.fn().mockResolvedValue(undefined), customer: vi.fn() },
  injectQueuedSales: vi.fn(),
}))

import { ApiError, api } from "@/lib/api/client"
import { syncPendingSales } from "@/lib/services/checkout"
import { usePosStore, type QueuedSale } from "@/lib/stores/pos-store"
import { useAuthStore } from "@/lib/stores/auth-store"

const apiMock = vi.mocked(api)
const sale = (key: string, at: string, over: Partial<QueuedSale> = {}): QueuedSale => ({ idempotencyKey: key, occurredAt: at, payload: { lines: [] }, userId: "u1", status: "pending", ...over })

beforeEach(() => {
  apiMock.mockReset()
  usePosStore.setState({ queue: [], offlineMode: false })
  useAuthStore.setState({ user: { id: "u1", name: "Cashier" } as never })
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true })
})

describe("uploading sales made offline", () => {
  it("sends them oldest first and removes the ones the server saved", async () => {
    usePosStore.setState({ queue: [sale("k2", "2026-01-02T10:00:00Z"), sale("k1", "2026-01-02T09:00:00Z")] })
    apiMock.mockResolvedValueOnce({ results: [{ idempotencyKey: "k1", status: "created" }, { idempotencyKey: "k2", status: "duplicate" }] })

    const out = await syncPendingSales()

    const sent = (apiMock.mock.calls[0]![1] as { body: { sales: { idempotencyKey: string }[] } }).body.sales
    expect(sent.map((s) => s.idempotencyKey)).toEqual(["k1", "k2"])
    expect(out.saved).toBe(2)
    expect(usePosStore.getState().queue).toHaveLength(0)
  })

  it("keeps a sale the server refused, flagged for a person, instead of dropping it", async () => {
    usePosStore.setState({ queue: [sale("bad", "2026-01-02T09:00:00Z")] })
    apiMock.mockResolvedValueOnce({ results: [{ idempotencyKey: "bad", status: "rejected", error: { code: "SHIFT_REQUIRED", message: "Open a shift before selling" } }] })

    const out = await syncPendingSales()

    expect(out.needsAttention).toBe(1)
    const [kept] = usePosStore.getState().queue
    expect(kept).toMatchObject({ idempotencyKey: "bad", status: "needs_attention", error: { message: "Open a shift before selling" }, attempts: 1 })

    // it is not retried by itself; only when a person says so
    apiMock.mockClear()
    await syncPendingSales()
    expect(apiMock).not.toHaveBeenCalled()
    usePosStore.getState().retry("bad")
    expect(usePosStore.getState().queue[0]!.status).toBe("pending")
  })

  it("leaves everything in the queue, and reports it, when the server cannot be reached", async () => {
    usePosStore.setState({ queue: [sale("a", "2026-01-02T09:00:00Z"), sale("b", "2026-01-02T09:05:00Z")] })
    apiMock.mockRejectedValueOnce(new ApiError(0, "NETWORK", "Cannot reach the server"))

    const out = await syncPendingSales()

    expect(out.failedToReach).toBe(true)
    expect(usePosStore.getState().queue.map((q) => q.idempotencyKey)).toEqual(["a", "b"])
    expect(usePosStore.getState().queue.every((q) => q.status === "pending")).toBe(true)
  })

  it("retries a sale the server asked to retry, and does not touch it otherwise", async () => {
    usePosStore.setState({ queue: [sale("slow", "2026-01-02T09:00:00Z")] })
    apiMock.mockResolvedValueOnce({ results: [{ idempotencyKey: "slow", status: "retry", error: { message: "try later" } }] })
    await syncPendingSales()
    expect(usePosStore.getState().queue[0]).toMatchObject({ status: "pending", attempts: 1 })
  })

  it("never uploads another person's sales under this sign-in", async () => {
    usePosStore.setState({ queue: [sale("mine", "2026-01-02T09:00:00Z"), sale("theirs", "2026-01-02T09:01:00Z", { userId: "someone-else" })] })
    apiMock.mockResolvedValueOnce({ results: [{ idempotencyKey: "mine", status: "created" }] })

    await syncPendingSales()

    const sent = (apiMock.mock.calls[0]![1] as { body: { sales: { idempotencyKey: string }[] } }).body.sales
    expect(sent.map((s) => s.idempotencyKey)).toEqual(["mine"])
    expect(usePosStore.getState().queue.map((q) => q.idempotencyKey)).toEqual(["theirs"])
  })

  it("does nothing while offline", async () => {
    usePosStore.setState({ queue: [sale("a", "2026-01-02T09:00:00Z")], offlineMode: true })
    await syncPendingSales()
    expect(apiMock).not.toHaveBeenCalled()
    expect(usePosStore.getState().queue).toHaveLength(1)
  })

  it("splits a long queue into batches of 50", async () => {
    const many = Array.from({ length: 120 }, (_, i) => sale(`k${String(i).padStart(3, "0")}`, `2026-01-02T09:${String(Math.floor(i / 60)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}Z`))
    usePosStore.setState({ queue: many })
    apiMock.mockImplementation(async (_p, opts) => ({ results: (opts as { body: { sales: { idempotencyKey: string }[] } }).body.sales.map((s) => ({ idempotencyKey: s.idempotencyKey, status: "created" })) }))
    const out = await syncPendingSales()
    expect(apiMock).toHaveBeenCalledTimes(3)
    expect(out.saved).toBe(120)
    expect(usePosStore.getState().queue).toHaveLength(0)
  })
})
