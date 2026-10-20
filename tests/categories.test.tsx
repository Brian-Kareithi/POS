import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { apiError, mockApi } from "./helpers"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("@/lib/toast", () => ({ notify: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }))

import CategoriesPage from "@/app/(dashboard)/products/categories/page"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"

const cat = (over: Record<string, unknown> = {}) => ({ id: "c1", businessId: "b1", name: "Drinks", slug: "drinks", description: null, parentId: null, isActive: true, ...over })
const page = (rows: unknown[]) => ({ body: { data: rows, meta: { page: 1, limit: 15, total: rows.length, pages: 1 } } })

function signIn(role: "owner" | "cashier") {
  useAuthStore.setState({ user: { id: "u1", email: "o@x.co", name: "O", role, businessId: "b1", emailVerified: true, twoFactorEnabled: false, createdAt: "", updatedAt: "" }, isAuthenticated: true, token: "t", refreshToken: "r", validated: true })
  useDataStore.setState({ categories: [cat() as never] })
}

beforeEach(() => signIn("owner"))

describe("categories", () => {
  it("lists categories and hides the controls from people who can only view", async () => {
    signIn("cashier")
    mockApi({ "GET /categories": () => page([cat()]) })
    render(<CategoriesPage />)
    expect(await screen.findByText("Drinks")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /add category/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /edit drinks/i })).toBeNull()
  })

  it("shows an empty state", async () => {
    mockApi({ "GET /categories": () => page([]) })
    render(<CategoriesPage />)
    expect(await screen.findByText("No categories yet")).toBeInTheDocument()
  })

  it("creates a category with a parent and refreshes the list", async () => {
    let rows = [cat()]
    const created = cat({ id: "c2", name: "Soda", slug: "soda", description: "Fizzy", parentId: "c1" })
    const calls = mockApi({
      "GET /categories": () => page(rows),
      "POST /categories": () => { rows = [...rows, created]; return { status: 201, body: created } },
    })
    const user = userEvent.setup()
    render(<CategoriesPage />)
    await screen.findByText("Drinks")
    await user.click(screen.getAllByRole("button", { name: /add category/i })[0])
    const dialog = await screen.findByRole("dialog", { name: "Add category" })
    await user.type(within(dialog).getByLabelText("Name"), "  Soda ")
    await user.type(within(dialog).getByLabelText("Description (optional)"), "Fizzy")
    await user.selectOptions(within(dialog).getByLabelText("Parent category (optional)"), "c1")
    await user.click(within(dialog).getByRole("button", { name: "Add category" }))

    await waitFor(() => expect(calls.some((c) => c.method === "POST" && c.path === "/categories")).toBe(true))
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({ name: "Soda", isActive: true, description: "Fizzy", parentId: "c1" })
    expect(await screen.findByText("Soda")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(useDataStore.getState().categories.some((c) => c.id === "c2")).toBe(true)
  })

  it("explains validation problems before calling the server", async () => {
    const calls = mockApi({ "GET /categories": () => page([cat()]) })
    const user = userEvent.setup()
    render(<CategoriesPage />)
    await screen.findByText("Drinks")
    await user.click(screen.getAllByRole("button", { name: /add category/i })[0])
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Add category" }))
    expect(await within(dialog).findByText("Enter a name.")).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText("Name"), "Ok")
    await user.click(within(dialog).getByLabelText("Description (optional)"))
    await user.paste("x".repeat(501))
    await user.click(within(dialog).getByRole("button", { name: "Add category" }))
    expect(await within(dialog).findByText("The description can be at most 500 characters.")).toBeInTheDocument()
    expect(calls.some((c) => c.method === "POST")).toBe(false)
  })

  it("does not offer a category as its own parent", async () => {
    mockApi({ "GET /categories": () => page([cat()]) })
    const user = userEvent.setup()
    render(<CategoriesPage />)
    await user.click(await screen.findByRole("button", { name: "Edit Drinks" }))
    const parent = within(await screen.findByRole("dialog", { name: "Edit category" })).getByLabelText("Parent category (optional)")
    expect(within(parent).queryByRole("option", { name: "Drinks" })).toBeNull()
  })

  it("explains a category that is in use and offers to deactivate it", async () => {
    const calls = mockApi({
      "GET /categories": () => page([cat()]),
      "DELETE /categories/c1": () => apiError(409, "IN_USE", "Category is used by 3 product(s). Deactivate instead."),
      "PATCH /categories/c1": () => ({ body: cat({ isActive: false }) }),
    })
    const user = userEvent.setup()
    render(<CategoriesPage />)
    await user.click(await screen.findByRole("button", { name: "Remove Drinks" }))
    const dialog = await screen.findByRole("dialog", { name: "Remove category?" })
    await user.click(within(dialog).getByRole("button", { name: "Remove" }))
    expect(await within(dialog).findByText("This category is used by 3 product(s). Deactivate it instead.")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Deactivate" }))
    await waitFor(() => expect(calls.some((c) => c.method === "PATCH" && c.path === "/categories/c1")).toBe(true))
    expect(calls.find((c) => c.method === "PATCH")?.body).toEqual({ isActive: false })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })
})
