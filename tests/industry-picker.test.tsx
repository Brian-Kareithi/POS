import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { mockApi } from "./helpers"
import { IndustryPicker } from "@/components/auth/industry-picker"
import type { Industry, IndustryOption } from "@/lib/types"

const opt = (id: Industry, label: string, description: string): IndustryOption => ({ id, label, description, icon: "store", modules: ["pos"], roles: ["Cashier"], recordTypes: [] })
const OPTIONS = [
  opt("retail", "Retail & Supermarkets", "Shops, supermarkets, boutiques and mini-marts."),
  opt("beauty_wellness", "Beauty & Wellness", "Salons, barbershops, spas and gyms."),
  opt("healthcare_pharmacy", "Healthcare & Pharmacies", "Pharmacies, clinics, dental and optical practices."),
]

async function open(onChange: (v: Industry) => void = () => {}) {
  mockApi({ "GET /industries": () => ({ status: 200, body: OPTIONS }) })
  const user = userEvent.setup()
  render(<IndustryPicker value="" onChange={onChange} />)
  await user.click(await screen.findByRole("button", { name: /what kind of business/i }))
  return user
}

describe("industry picker", () => {
  it("starts closed, so nobody scrolls past a wall of cards", async () => {
    mockApi({ "GET /industries": () => ({ status: 200, body: OPTIONS }) })
    render(<IndustryPicker value="" onChange={() => {}} />)
    expect(await screen.findByRole("button", { name: /what kind of business/i })).toBeInTheDocument()
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("finds a business by everyday words, not just our names for them", async () => {
    const user = await open()
    await user.type(screen.getByLabelText("Search business types"), "pharmacy")
    expect(screen.getAllByRole("option")).toHaveLength(1)
    await user.clear(screen.getByLabelText("Search business types"))
    await user.type(screen.getByLabelText("Search business types"), "kinyozi")
    expect(screen.getByRole("option", { name: /Beauty & Wellness/ })).toBeInTheDocument()
  })

  it("says so when nothing matches, and offers the full list", async () => {
    const user = await open()
    await user.type(screen.getByLabelText("Search business types"), "spaceship")
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /show all business types/i }))
    expect(screen.getAllByRole("option")).toHaveLength(3)
  })

  it("picks with the keyboard and closes", async () => {
    const picked: string[] = []
    const user = await open((v: string) => picked.push(v))
    await user.keyboard("{ArrowDown}{Enter}")
    expect(picked).toEqual(["beauty_wellness"])
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("has no 'Other' to fall back on", async () => {
    await open()
    expect(screen.queryByText(/^other/i)).toBeNull()
  })
})
