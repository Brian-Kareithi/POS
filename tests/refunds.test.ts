import { describe, expect, it } from "vitest"
import { refundShare, refundState, unitsLeft } from "@/lib/utils/refunds"

const item = (quantity: number, refundedQty = 0, total = quantity * 100) => ({ quantity, refundedQty, total })

describe("partial refund helpers", () => {
  it("counts the units still refundable on a line", () => {
    expect(unitsLeft(item(3))).toBe(3)
    expect(unitsLeft(item(3, 2))).toBe(1)
    expect(unitsLeft({ quantity: 3 })).toBe(3)
  })

  it("estimates what some units of a line are worth", () => {
    expect(refundShare(item(4, 0, 400), 1)).toBe(100)
    expect(refundShare(item(3, 0, 300), 2)).toBe(200)
    expect(refundShare(item(0, 0, 0), 1)).toBe(0)
  })

  it("tells none, partial and full apart, however the sale got there", () => {
    expect(refundState({ status: "completed", items: [item(2)] })).toBe("none")
    expect(refundState({ status: "completed", refundedAmount: 100, items: [item(2, 1)] })).toBe("partial")
    expect(refundState({ status: "completed", refundedAmount: 200, items: [item(2, 2)] })).toBe("full") // finished in steps
    expect(refundState({ status: "refunded", items: [item(2, 0)] })).toBe("full") // refunded in one go
  })
})
