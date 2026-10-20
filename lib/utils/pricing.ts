import type { Customer, Product, Promotion } from "@/lib/types"

/** A promotion or coupon the server has already validated for this code. */
export interface PromoRule {
  type: "percent" | "fixed" | "bogo"
  value: number
  productId?: string
  /** Shown next to the discount line. */
  code: string
}

export interface DiscountInput {
  kind: "percent" | "amount"
  value: number
  coupon: string
  redeem: number
  rule?: PromoRule
}

export interface DiscountResult {
  manual: number
  promo: number
  loyalty: number
  total: number
  promotion?: PromoRule
}

export function activePromotion(promotions: Promotion[], code: string, now = Date.now()): Promotion | undefined {
  const c = code.trim().toUpperCase()
  if (!c) return undefined
  return promotions.find((p) => p.code === c && p.isActive && new Date(p.startsAt).getTime() <= now && new Date(p.endsAt).getTime() >= now)
}

export function computeDiscount(
  lines: { product: Product; quantity: number }[],
  subtotal: number,
  input: DiscountInput,
  promotions: Promotion[],
  customer?: Customer
): DiscountResult {
  const manual = input.kind === "percent" ? (subtotal * input.value) / 100 : input.value
  const found = activePromotion(promotions, input.coupon)
  const promotion: PromoRule | undefined = input.rule ?? (found ? { type: found.type, value: found.value, productId: found.productId, code: found.code } : undefined)
  let promo = 0
  if (promotion) {
    if (promotion.type === "percent") promo = (subtotal * promotion.value) / 100
    else if (promotion.type === "fixed") promo = promotion.value
    else {
      const line = lines.find((l) => l.product.id === promotion.productId)
      if (line) promo = Math.floor(line.quantity / (promotion.value + 1)) * promotion.value * line.product.sellingPrice
    }
  }
  const afterOthers = Math.max(0, subtotal - manual - promo)
  const loyalty = Math.min(customer ? Math.min(input.redeem, customer.loyaltyPoints) : 0, afterOthers)
  const total = Math.min(subtotal, manual + promo + loyalty)
  const r = (n: number) => Math.round(n * 100) / 100
  return { manual: r(manual), promo: r(promo), loyalty: r(loyalty), total: r(total), promotion }
}
