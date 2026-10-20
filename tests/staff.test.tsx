import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockApi } from "./helpers"

let query = "tab=pending"
const replace = vi.fn((url: string) => { query = url.includes("?") ? url.split("?")[1] : "" })
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }), useSearchParams: () => new URLSearchParams(query) }))
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
vi.mock("@/lib/toast", () => ({ notify: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() } }))

import EmployeesPage from "@/app/(dashboard)/employees/page"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useDataStore } from "@/lib/stores/data-store"
import { toStaff } from "@/lib/api/mappers"

const row = (over: Record<string, unknown>) => ({
  id: "e1", userId: "u1", businessId: "b1", branchId: null, role: "cashier", salary: null, hireDate: "2026-10-01T00:00:00Z",
  isActive: false, approval: "pending", name: "Wanjiru Kamau", email: "wanjiru@example.com", phone: null, avatar: null, createdAt: "2026-10-01T00:00:00Z", ...over,
})

function seed(rows: ReturnType<typeof row>[], role: "owner" | "manager" = "owner") {
  const staff = rows.map(toStaff)
  useAuthStore.setState({ user: { id: "owner1", email: "o@x.co", name: "Owner", role, businessId: "b1", emailVerified: true, twoFactorEnabled: false, createdAt: "", updatedAt: "" }, isAuthenticated: true, token: "t", refreshToken: "r" })
  useDataStore.setState({
    loaded: true,
    business: { id: "b1", name: "Acme", slug: "acme-stores", email: "", phone: "", address: "", currency: "KES", timezone: "Africa/Nairobi", createdAt: "" },
    branches: [{ id: "br1", businessId: "b1", name: "Westlands", address: "", phone: "", email: "", isActive: true, createdAt: "" }],
    employees: staff.map((s) => s.employee), users: staff.map((s) => s.user),
  })
}

beforeEach(() => { query = "tab=pending"; replace.mockClear() })

describe("staff page: access requests", () => {
  it("lists pending requests and approves with the chosen role, branch and salary", async () => {
    seed([row({})])
    const approved = row({ approval: "approved", isActive: true, role: "manager", branchId: "br1", salary: 45000 })
    const calls = mockApi({
      "POST /staff/e1/approve": () => ({ body: approved }),
      "GET /staff": () => ({ body: [approved] }),
    })
    const user = userEvent.setup()
    render(<EmployeesPage />)

    const pendingRow = (await screen.findByText("Wanjiru Kamau")).closest("tr")!
    expect(within(pendingRow).getByText("wanjiru@example.com")).toBeInTheDocument()
    await user.click(within(pendingRow).getByRole("button", { name: "Approve" }))

    const dialog = await screen.findByRole("dialog", { name: "Approve Wanjiru Kamau" })
    await user.selectOptions(within(dialog).getByLabelText("Role"), "manager")
    await user.selectOptions(within(dialog).getByLabelText("Branch (optional)"), "br1")
    await user.type(within(dialog).getByLabelText("Monthly salary (KES, optional)"), "45000")
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))

    await waitFor(() => expect(calls.some((c) => c.path === "/staff/e1/approve")).toBe(true))
    expect(calls.find((c) => c.path === "/staff/e1/approve")).toMatchObject({ method: "POST", body: { role: "manager", branchId: "br1", salary: 45000 } })
    // The list is re-read from the server afterwards, so the request leaves the Pending tab.
    await waitFor(() => expect(screen.queryByText("Wanjiru Kamau")).toBeNull())
    expect(useDataStore.getState().employees[0].approval).toBe("approved")
  })

  it("defaults the role to cashier and leaves branch and salary out when they are blank", async () => {
    seed([row({})])
    const calls = mockApi({ "POST /staff/e1/approve": () => ({ body: row({ approval: "approved", isActive: true }) }), "GET /staff": () => ({ body: [] }) })
    const user = userEvent.setup()
    render(<EmployeesPage />)
    await user.click(within((await screen.findByText("Wanjiru Kamau")).closest("tr")!).getByRole("button", { name: "Approve" }))
    const dialog = await screen.findByRole("dialog", { name: "Approve Wanjiru Kamau" })
    expect(within(dialog).getByLabelText("Role")).toHaveValue("cashier")
    await user.click(within(dialog).getByRole("button", { name: "Approve" }))
    await waitFor(() => expect(calls.some((c) => c.path === "/staff/e1/approve")).toBe(true))
    expect(calls.find((c) => c.path === "/staff/e1/approve")?.body).toEqual({ role: "cashier" })
  })

  it("asks for confirmation before declining", async () => {
    seed([row({})])
    const calls = mockApi({ "POST /staff/e1/decline": () => ({ body: row({ approval: "rejected" }) }), "GET /staff": () => ({ body: [row({ approval: "rejected" })] }) })
    const user = userEvent.setup()
    render(<EmployeesPage />)
    await user.click(within((await screen.findByText("Wanjiru Kamau")).closest("tr")!).getByRole("button", { name: "Decline" }))
    expect(calls.some((c) => c.path === "/staff/e1/decline")).toBe(false)
    expect(screen.getByText("Decline this request?")).toBeInTheDocument()
    const dialog = screen.getByRole("dialog", { name: "Decline this request?" })
    await user.click(within(dialog).getByRole("button", { name: "Decline" }))
    await waitFor(() => expect(calls.some((c) => c.path === "/staff/e1/decline")).toBe(true))
    await waitFor(() => expect(useDataStore.getState().employees[0].approval).toBe("rejected"))
  })

  it("hides approve and decline from people without staff.manage", async () => {
    seed([row({})], "manager")
    mockApi({})
    render(<EmployeesPage />)
    expect(await screen.findByText("Wanjiru Kamau")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull()
    expect(screen.queryByText("Share join link")).toBeNull()
  })

  it("shows the join link for the business slug", async () => {
    seed([])
    mockApi({})
    render(<EmployeesPage />)
    const input = (await screen.findByLabelText("Join link")) as HTMLInputElement
    expect(input.value).toBe(`${window.location.origin}/join?business=acme-stores`)
  })

  it("shows an empty state when nobody is waiting", async () => {
    seed([])
    mockApi({})
    render(<EmployeesPage />)
    expect(await screen.findByText("No pending requests")).toBeInTheDocument()
  })
})
