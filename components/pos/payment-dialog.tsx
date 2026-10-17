"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils/format"
import type { Customer, PaymentMethod } from "@/lib/types"
import type { PaymentInput } from "@/lib/services/checkout"
import { Banknote, CreditCard, Landmark, Smartphone, Trash2, Loader2, CheckCircle2, XCircle, UserRound } from "lucide-react"

interface Props {
  open: boolean
  total: number
  customer?: Customer
  busy?: boolean
  onClose: () => void
  onComplete: (result: { payments: PaymentInput[]; cashTendered?: number }) => void
}

type Method = Exclude<PaymentMethod, "credit">
const methods: { id: Method; label: string; icon: React.ReactNode }[] = [
  { id: "cash", label: "Cash", icon: <Banknote className="h-5 w-5" /> },
  { id: "mobile_money", label: "M-Pesa", icon: <Smartphone className="h-5 w-5" /> },
  { id: "card", label: "Card", icon: <CreditCard className="h-5 w-5" /> },
  { id: "bank_transfer", label: "Bank", icon: <Landmark className="h-5 w-5" /> },
]
const label = (m: PaymentMethod) => (m === "mobile_money" ? "M-Pesa" : m === "bank_transfer" ? "Bank transfer" : m === "card" ? "Card" : m === "credit" ? "On account" : "Cash")

export function PaymentDialog(props: Props) {
  return props.open ? <PaymentForm {...props} /> : null
}

type Stk = { state: "idle" } | { state: "pending"; phone: string; amount: number } | { state: "failed"; message: string }

function PaymentForm({ total, customer, busy, onClose, onComplete }: Props) {
  const [payments, setPayments] = useState<PaymentInput[]>([])
  const [method, setMethod] = useState<Method>("cash")
  const [amount, setAmount] = useState("")
  const [received, setReceived] = useState("")
  const [reference, setReference] = useState("")
  const [phone, setPhone] = useState(customer?.phone.replace(/\s/g, "") ?? "")
  const [stk, setStk] = useState<Stk>({ state: "idle" })
  const [cashTendered, setCashTendered] = useState(0)
  const [error, setError] = useState("")

  const paid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, Math.round((total - paid) * 100) / 100)
  const available = customer ? Math.max(0, (customer.creditLimit ?? 0) - (customer.amountOwed ?? 0)) : 0
  const canUseAccount = !!customer && remaining > 0 && remaining <= available

  const target = Math.min(parseFloat(amount) || remaining, remaining)
  const receivedNum = parseFloat(received) || 0
  const change = method === "cash" && receivedNum > target ? receivedNum - target : 0

  const push = (p: PaymentInput) => {
    setPayments((all) => [...all, p])
    setAmount("")
    setReceived("")
    setReference("")
    setError("")
  }

  const addPayment = () => {
    if (remaining <= 0) return
    if (target <= 0) return setError("Enter an amount.")
    if (method === "cash") {
      if (receivedNum < target) return setError("Cash received is less than the amount.")
      setCashTendered((c) => c + receivedNum)
      return push({ method: "cash", amount: target })
    }
    if (method === "mobile_money") {
      if (!/^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""))) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.")
      setError("")
      return setStk({ state: "pending", phone, amount: target })
    }
    push({ method, amount: target, reference: reference.trim() || undefined })
  }

  const resolveStk = (outcome: "paid" | "cancelled" | "insufficient") => {
    if (stk.state !== "pending") return
    if (outcome === "paid") {
      const code = `S${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9e7 + 1e7)}K`
      push({ method: "mobile_money", amount: stk.amount, reference: code })
      setStk({ state: "idle" })
    } else {
      setStk({ state: "failed", message: outcome === "cancelled" ? "The customer cancelled the request on their phone." : "The M-Pesa balance was too low. Try a smaller amount or another method." })
    }
  }

  const finish = () => {
    if (busy) return
    onComplete({ payments, cashTendered: cashTendered || undefined })
  }

  return (
    <Dialog open onClose={busy ? () => {} : onClose} title="Take payment" size="md">
      <div className="space-y-4">
        <div className="flex items-end justify-between rounded-xl bg-blue-50 p-4">
          <div>
            <p className="text-xs text-gray-500">Total due</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Remaining</p>
            <p className={`text-xl font-semibold ${remaining === 0 ? "text-green-600" : "text-blue-700"}`}>{formatCurrency(remaining)}</p>
          </div>
        </div>

        {payments.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
            {payments.map((p, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2">
                <span>{label(p.method)}{p.reference && <span className="ml-2 font-mono text-xs text-gray-400">{p.reference}</span>}</span>
                <span className="flex items-center gap-3 font-medium">
                  {formatCurrency(p.amount)}
                  <button aria-label="Remove payment" onClick={() => setPayments((all) => all.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {remaining > 0 && stk.state === "idle" && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {methods.map((m) => (
                <button key={m.id} onClick={() => { setMethod(m.id); setError("") }} className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-xs font-medium ${method === m.id ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(remaining)} />
              {method === "cash" && <Input label="Cash received" type="number" min="0" value={received} onChange={(e) => setReceived(e.target.value)} placeholder={String(Math.ceil(target))} />}
              {method === "mobile_money" && <Input label="Customer phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />}
              {(method === "card" || method === "bank_transfer") && <Input label={method === "card" ? "Approval code (optional)" : "Reference (optional)"} value={reference} onChange={(e) => setReference(e.target.value)} />}
            </div>
            {method === "cash" && receivedNum > 0 && (
              <div className="flex flex-wrap gap-2">
                {[Math.ceil(target), 500, 1000, 2000].filter((v, i, a) => v >= target && a.indexOf(v) === i).map((v) => (
                  <button key={v} onClick={() => setReceived(String(v))} className="rounded-full border border-gray-200 px-3 py-1 text-xs hover:bg-gray-50">{formatCurrency(v)}</button>
                ))}
              </div>
            )}
            {change > 0 && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">Change to give: {formatCurrency(change)}</p>}
            <Button className="w-full" variant="secondary" onClick={addPayment}>{method === "mobile_money" ? "Send M-Pesa request" : `Add ${label(method)} payment`}</Button>
          </>
        )}

        {stk.state === "pending" && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
            <p className="text-sm font-medium text-green-800">M-Pesa request for {formatCurrency(stk.amount)} sent to {stk.phone}</p>
            <p className="text-xs text-green-700">Waiting for the customer to enter their PIN. Demo controls:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" onClick={() => resolveStk("paid")}><CheckCircle2 className="h-4 w-4" />Customer paid</Button>
              <Button size="sm" variant="secondary" onClick={() => resolveStk("cancelled")}>Cancelled</Button>
              <Button size="sm" variant="secondary" onClick={() => resolveStk("insufficient")}>Insufficient funds</Button>
            </div>
          </div>
        )}
        {stk.state === "failed" && (
          <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-red-700"><XCircle className="h-4 w-4" />{stk.message}</p>
            <p className="text-xs text-red-600">Nothing was charged and no sale was recorded.</p>
            <Button size="sm" variant="secondary" onClick={() => setStk({ state: "idle" })}>Try again or choose another method</Button>
          </div>
        )}

        {remaining > 0 && customer && (
          <p className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${canUseAccount ? "bg-gray-50 text-gray-600" : "bg-orange-50 text-orange-700"}`}>
            <UserRound className="h-4 w-4" />
            {customer.name}: credit available {formatCurrency(available)}{canUseAccount ? " — you can put the balance on their account." : " — not enough to cover the balance."}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Back</Button>
          {remaining === 0 ? (
            <Button className="flex-1" size="lg" onClick={finish} isLoading={busy}>Complete sale</Button>
          ) : (
            <Button className="flex-1" size="lg" disabled={!canUseAccount || stk.state === "pending" || busy} onClick={finish} isLoading={busy}>
              Put {formatCurrency(remaining)} on account
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
