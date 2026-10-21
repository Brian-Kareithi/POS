import { describe, expect, it } from "vitest"
import { landingFor, navFor, routeAllowed } from "@/lib/navigation"
import type { IndustryConfig, ModuleId, RecordTypeDef, Role } from "@/lib/types"

const BASE: ModuleId[] = ["dashboard", "pos", "products", "inventory", "sales", "customers", "insights", "shifts", "staff", "hours", "accounting", "reports", "audit", "settings"]
const appointment: RecordTypeDef = {
  key: "appointment", label: "Appointment", plural: "Appointments", description: "", numberPrefix: "APT", titleField: "service",
  fields: [], statuses: [{ key: "booked", label: "Booked", tone: "info" }], closed: [],
}
const config = (modules: ModuleId[], recordTypes: RecordTypeDef[] = [], terms: Partial<IndustryConfig["terms"]> = {}): IndustryConfig => ({
  industry: "retail", label: "Test", icon: "layers", modules, recordTypes, roles: [],
  terms: { pos: "POS", products: "Products", inventory: "Inventory", sales: "Sales", customers: "Customers", customer: "Customer", ...terms },
})

const logistics = config([...BASE, "deliveries", "fleet"], [], { pos: "Booking Desk", customers: "Shippers & Clients" })
const salon = config([...BASE], [appointment], { customers: "Clients" })
const labels = (role: Role, c: IndustryConfig) => navFor(role, c).map((i) => i.label)

describe("the portal's tabs follow the industry", () => {
  it("gives a courier business deliveries and a fleet, and its own words", () => {
    const owner = labels("owner", logistics)
    expect(owner).toEqual(expect.arrayContaining(["Deliveries", "Fleet", "Booking Desk", "Shippers & Clients", "Hours worked"]))
  })

  it("does not show deliveries or fleet to a salon, but shows its appointments", () => {
    const owner = labels("owner", salon)
    expect(owner).not.toContain("Deliveries")
    expect(owner).not.toContain("Fleet")
    expect(owner).toEqual(expect.arrayContaining(["Appointments", "Clients"]))
  })

  it("shows a rider only their deliveries and their hours", () => {
    expect(labels("rider", logistics)).toEqual(["My deliveries", "My hours"])
  })

  it("lets a dispatcher run deliveries but not stock or settings", () => {
    const l = labels("dispatcher", logistics)
    expect(l).toEqual(expect.arrayContaining(["Deliveries", "Fleet"]))
    expect(l).not.toContain("Settings")
    expect(l).not.toContain("Staff")
  })

  it("shows the owner everyone's hours and the cashier only their own", () => {
    expect(labels("owner", salon)).toContain("Hours worked")
    expect(labels("cashier", salon)).toContain("My hours")
  })
})

describe("pages are guarded by industry and role", () => {
  it("blocks pages for modules the business does not use", () => {
    expect(routeAllowed("owner", "/deliveries", salon)).toBe(false)
    expect(routeAllowed("owner", "/fleet", salon)).toBe(false)
    expect(routeAllowed("owner", "/deliveries", logistics)).toBe(true)
    expect(routeAllowed("owner", "/deliveries/abc", logistics)).toBe(true)
  })

  it("only allows record pages the industry defines", () => {
    expect(routeAllowed("cashier", "/work/appointment", salon)).toBe(true)
    expect(routeAllowed("cashier", "/work/prescription", salon)).toBe(false)
    expect(routeAllowed("rider", "/work/appointment", salon)).toBe(false)
  })

  it("keeps a rider out of everything but deliveries and hours", () => {
    expect(routeAllowed("rider", "/deliveries", logistics)).toBe(true)
    expect(routeAllowed("rider", "/employees/hours", logistics)).toBe(true)
    for (const p of ["/", "/sales", "/products", "/employees", "/settings", "/fleet", "/reports"]) expect(routeAllowed("rider", p, logistics), p).toBe(false)
  })

  it("fails closed on unknown pages", () => {
    expect(routeAllowed("owner", "/nonsense", logistics)).toBe(false)
  })
})

describe("where people land", () => {
  it("sends sellers to the till and riders to their deliveries", () => {
    expect(landingFor("owner", salon)).toBe("/overview")
    expect(landingFor("manager")).toBe("/overview")
    expect(landingFor("owner")).toBe("/overview") // before the industry has loaded
    expect(landingFor("cashier", salon)).toBe("/")
    expect(landingFor("rider", logistics)).toBe("/deliveries")
    expect(landingFor("dispatcher", logistics)).toBe("/deliveries")
  })

  it("has a sensible guess before the industry has loaded", () => {
    expect(landingFor("cashier")).toBe("/")
    expect(landingFor("stockkeeper")).toBe("/inventory")
    expect(landingFor("rider")).toBe("/deliveries")
  })
})
