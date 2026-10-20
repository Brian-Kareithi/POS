import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { apiError, mockApi } from "./helpers"

let query = "business=acme-stores"
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams(query) }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))

import JoinPage from "@/app/(auth)/join/page"
import { useAuthStore } from "@/lib/stores/auth-store"

async function fill(over: Partial<Record<"name" | "email" | "password" | "confirm", string>> = {}) {
  const user = userEvent.setup()
  render(<JoinPage />)
  await user.type(screen.getByLabelText("Full name"), over.name ?? "Wanjiru Kamau")
  await user.type(screen.getByLabelText("Email"), over.email ?? "wanjiru@example.com")
  await user.type(screen.getByLabelText("Password"), over.password ?? "password123")
  await user.type(screen.getByLabelText("Confirm password"), over.confirm ?? over.password ?? "password123")
  await user.click(screen.getByRole("button", { name: "Request access" }))
}

describe("join link", () => {
  it("sends the business slug, shows 'request sent' and does not sign the person in", async () => {
    query = "business=acme-stores"
    const calls = mockApi({ "POST /auth/register": () => ({ status: 202, body: { message: "Request received." } }) })
    await fill()
    expect(await screen.findByText("Request sent")).toBeInTheDocument()
    expect(screen.getByText(/owner will review it before you can sign in/i)).toBeInTheDocument()
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ method: "POST", path: "/auth/register", body: { name: "Wanjiru Kamau", email: "wanjiru@example.com", password: "password123", businessSlug: "acme-stores" } })
    expect(calls.some((c) => c.path === "/auth/login")).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("checks the form like the API does", async () => {
    const calls = mockApi({})
    await fill({ password: "short", confirm: "short" })
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it("catches mismatched passwords", async () => {
    mockApi({})
    await fill({ password: "password123", confirm: "password124" })
    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument()
  })

  it.each([
    ["BUSINESS_NOT_FOUND", 400, "This join link is invalid. Ask your employer for the correct link."],
    ["BUSINESS_REQUIRED", 400, "This join link is invalid. Ask your employer for the correct link."],
    ["REGISTRATION_FAILED", 409, "We could not register with those details."],
    ["RATE_LIMITED", 429, "Too many attempts. Please try again later."],
  ])("maps %s to a clear message", async (code, status, text) => {
    mockApi({ "POST /auth/register": () => apiError(status, code, "server wording that must not be shown") })
    await fill()
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(text)
    expect(alert).not.toHaveTextContent(/exists|already/i)
  })

  it("explains a link with no business in it", () => {
    query = ""
    render(<JoinPage />)
    expect(screen.getByText(/join link is invalid/i)).toBeInTheDocument()
    expect(screen.queryByLabelText("Email")).toBeNull()
  })
})
