"use client"

import { useState } from "react"
import { api, errorMessage } from "@/lib/api/client"
import { formatCurrency } from "@/lib/utils/format"
import type { PromoRule } from "@/lib/utils/pricing"
import type { DiscountState } from "@/components/pos/discount-dialog"
import { Tag, X } from "lucide-react"

interface Props {
  subtotal: number
  discount: DiscountState
  /** What the code is taking off the current total, for the applied chip. */
  savings: number
  onChange: (next: DiscountState) => void
}

/** Lets whoever is serving enter a customer's discount code or promotion code straight on the sale. The server checks it again when the sale is saved. */
export function PromoCodeBox({ subtotal, discount, savings, onChange }: Props) {
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const apply = async (e: React.FormEvent) => {
    e.preventDefault()
    const entered = code.trim().toUpperCase()
    if (!entered || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await api<{ valid: boolean; reason?: string; type?: PromoRule["type"]; value?: number; productId?: string | null }>("/promotions/validate", {
        method: "POST", body: { code: entered, subtotal },
      })
      if (!res.valid || !res.type || res.value === undefined) {
        setError(res.reason ?? "That code is not valid.")
        return
      }
      onChange({ ...discount, coupon: entered, rule: { type: res.type, value: Number(res.value), productId: res.productId ?? undefined, code: entered } })
      setCode("")
    } catch (err) {
      setError(errorMessage(err, "Could not check that code."))
    } finally {
      setBusy(false)
    }
  }

  if (discount.coupon) {
    return (
      <div className="mb-2 flex items-center justify-between rounded-lg border border-pos-accent-line bg-pos-accent px-3 py-2 text-[11px] text-pos-green">
        <span className="flex items-center gap-1.5 font-semibold"><Tag size={13} />{discount.coupon}{savings > 0 && <span className="font-normal">· -{formatCurrency(savings)}</span>}</span>
        <button type="button" aria-label={`Remove code ${discount.coupon}`} onClick={() => onChange({ ...discount, coupon: "", rule: undefined })} className="text-pos-muted hover:text-pos-danger"><X size={14} /></button>
      </div>
    )
  }

  return (
    <form onSubmit={apply} className="mb-2">
      <div className="flex gap-1.5">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Discount code</span>
          <Tag size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-pos-muted" />
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setError("") }}
            placeholder="Discount or promo code"
            autoComplete="off"
            className="h-9 w-full rounded-lg border border-pos-line bg-white pl-8 pr-2 text-[11px] uppercase placeholder:normal-case"
          />
        </label>
        <button type="submit" disabled={!code.trim() || busy} className="h-9 shrink-0 rounded-lg border border-pos-line px-3 text-[11px] font-semibold text-pos-sub hover:bg-pos-hover disabled:opacity-50">{busy ? "..." : "Apply"}</button>
      </div>
      {error && <p role="alert" className="mt-1 text-[10px] text-pos-danger">{error}</p>}
    </form>
  )
}
