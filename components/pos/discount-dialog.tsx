"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/stores/auth-store"
import { api, errorMessage } from "@/lib/api/client"
import { verifyApprovalPin } from "@/lib/api/approvals"
import { CASHIER_DISCOUNT_LIMIT_PERCENT, can } from "@/lib/permissions"
import type { PromoRule } from "@/lib/utils/pricing"
import { formatCurrency } from "@/lib/utils/format"
import type { Customer } from "@/lib/types"
import { ShieldCheck, Tag } from "lucide-react"

export interface DiscountState {
  kind: "percent" | "amount"
  value: number
  coupon: string
  redeem: number
  /** The server-validated promotion or coupon behind `coupon`, used for the on-screen estimate. */
  rule?: PromoRule
  approvedBy?: string
  /** Single-use manager approval, sent with the sale. */
  approvalToken?: string
}

export const noDiscount: DiscountState = { kind: "percent", value: 0, coupon: "", redeem: 0 }

interface Props {
  open: boolean
  subtotal: number
  customer?: Customer
  current: DiscountState
  onClose: () => void
  onApply: (state: DiscountState) => void
}

export function DiscountDialog(props: Props) {
  return props.open ? <Form {...props} /> : null
}

function Form({ subtotal, customer, current, onClose, onApply }: Props) {
  const [busy, setBusy] = useState(false)
  const role = useAuthStore((s) => s.user?.role)
  const [kind, setKind] = useState(current.kind)
  const [value, setValue] = useState(current.value ? String(current.value) : "")
  const [coupon, setCoupon] = useState(current.coupon)
  const [redeem, setRedeem] = useState(current.redeem ? String(current.redeem) : "")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const amount = parseFloat(value) || 0
  const pct = subtotal > 0 ? (kind === "percent" ? amount : (amount / subtotal) * 100) : 0
  const needsApproval = pct > CASHIER_DISCOUNT_LIMIT_PERCENT && !can(role, "discount.any")
  const points = Math.min(parseInt(redeem || "0", 10) || 0, customer?.loyaltyPoints ?? 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (amount < 0 || (kind === "percent" && amount > 100)) return setError("That discount isn't valid.")
    if (pct > 50) return setError("Discounts above 50% aren't allowed at the till.")
    setBusy(true)
    try {
      let approvedBy = current.approvedBy
      let approvalToken = current.approvalToken
      if (amount > 0 && needsApproval) {
        // A token is single use and expires, so ask again unless this same discount was already approved.
        const sameAsApproved = approvalToken && current.kind === kind && current.value === amount
        if (!sameAsApproved) {
          if (!pin) return setError("This discount needs a manager. Enter the manager PIN.")
          const approval = await verifyApprovalPin(pin)
          approvedBy = approval.approver.name
          approvalToken = approval.approvalToken
        }
      }
      const code = coupon.trim().toUpperCase()
      let rule: PromoRule | undefined
      if (code) {
        const res = await api<{ valid: boolean; reason?: string; type?: PromoRule["type"]; value?: number; productId?: string | null }>("/promotions/validate", { method: "POST", body: { code, subtotal } })
        if (!res.valid || !res.type || res.value === undefined) return setError(res.reason ?? `"${code}" isn't an active promotion code.`)
        rule = { type: res.type, value: Number(res.value), productId: res.productId ?? undefined, code }
      }
      const keep = amount > 0
      onApply({ kind, value: amount, coupon: code, redeem: points, rule, approvedBy: keep ? approvedBy : undefined, approvalToken: keep ? approvalToken : undefined })
    } catch (err) {
      setError(errorMessage(err, "Could not apply the discount."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title="Discount & promotions" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Manual discount</p>
          <div className="flex gap-2">
            <div className="grid w-28 grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-xs">
              {([["percent", "%"], ["amount", "KES"]] as const).map(([id, text]) => (
                <button key={id} type="button" onClick={() => setKind(id)} className={`rounded-md font-medium ${kind === id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"}`}>{text}</button>
              ))}
            </div>
            <div className="flex-1"><Input type="number" min="0" step={kind === "percent" ? 1 : 100} value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" /></div>
          </div>
          <p className="mt-1 text-xs text-gray-500">Cashiers can give up to {CASHIER_DISCOUNT_LIMIT_PERCENT}%. Anything higher needs a manager.</p>
        </div>

        {needsApproval && amount > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700"><ShieldCheck className="h-4 w-4" />Manager approval needed ({pct.toFixed(0)}% off)</p>
            <Input label="Manager PIN" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Manager's approval PIN" />
          </div>
        )}

        <Input label="Promo code" icon={<Tag className="h-4 w-4" />} value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="e.g. KARIBU10" />

        {customer && customer.loyaltyPoints > 0 && (
          <div>
            <Input label={`Redeem loyalty points (${customer.loyaltyPoints.toLocaleString()} available, 1 point = KES 1)`} type="number" min="0" max={customer.loyaltyPoints} value={redeem} onChange={(e) => setRedeem(e.target.value)} />
            {points > 0 && <p className="mt-1 text-xs text-green-600">Takes {formatCurrency(points)} off the bill.</p>}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between gap-2">
          <Button type="button" variant="secondary" onClick={() => onApply(noDiscount)}>Clear all</Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={busy}>Apply</Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
