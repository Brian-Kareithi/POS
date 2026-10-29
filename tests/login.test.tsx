import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { apiError, mockApi } from "./helpers"

const push = vi.fn()
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }), useSearchParams: () => new URLSearchParams() }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))

import LoginPage from "@/app/(auth)/login/page"
import { useAuthStore } from "@/lib/stores/auth-store"

async function signIn(email = "cashier@shop.co.ke", password = "password123") {
  const user = userEvent.setup()
  render(<LoginPage />)
  await user.type(screen.getByLabelText("Email"), email)
  await user.type(screen.getByLabelText("Password"), password)
  await user.click(screen.getByRole("button", { name: "Sign in" }))
}

describe("login", () => {
  it("shows a friendly waiting state, not a red error, while the account is pending", async () => {
    mockApi({ "POST /auth/login": () => apiError(403, "ACCOUNT_PENDING", "Your account is waiting for the owner to approve it.") })
    await signIn()
    const notice = await screen.findByRole("status")
    expect(notice).toHaveTextContent("Your account is waiting for the owner's approval")
    expect(notice.className).toMatch(/amber/)
    expect(screen.queryByRole("alert")).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it.each([
    ["ACCOUNT_REJECTED", "Your request was declined. Contact the owner."],
    ["ACCOUNT_DISABLED", "Your account has been switched off. Contact the owner."],
    ["INVALID_CREDENTIALS", "The password is wrong for this email address."],
    ["ACCOUNT_NOT_FOUND", "No account exists with that email address."],
  ])("explains %s clearly", async (code, text) => {
    mockApi({ "POST /auth/login": () => apiError(code === "INVALID_CREDENTIALS" || code === "ACCOUNT_NOT_FOUND" ? 401 : 403, code) })
    await signIn()
    expect(await screen.findByRole("alert")).toHaveTextContent(text)
  })

  it("asks for the two-factor code and sends it with the next attempt", async () => {
    const calls = mockApi({
      "POST /auth/login": (_u, init) => {
        const body = JSON.parse(String(init.body))
        return body.totpCode
          ? { body: { user: { id: "u1", email: "a@b.co", name: "A", role: "owner", businessId: "b1", emailVerified: true, twoFactorEnabled: true, createdAt: "", updatedAt: "" }, accessToken: "t", refreshToken: "r" } }
          : apiError(401, "TOTP_REQUIRED")
      },
    })
    await signIn("a@b.co")
    const code = await screen.findByLabelText("Two-factor code")
    await userEvent.type(code, "123456")
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }))
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true))
    expect(calls.at(-1)?.body).toMatchObject({ email: "a@b.co", totpCode: "123456" })
    expect(useAuthStore.getState().token).toBe("t")
    expect(push).toHaveBeenCalled()
  })

  it("validates the email before calling the server", async () => {
    const calls = mockApi({})
    await signIn("not-an-email")
    expect(await screen.findByText("That doesn't look like an email address")).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })
})
