"use client"

import { useEffect, useState } from "react"
import { api, errorMessage } from "@/lib/api/client"
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
  branchId?: string
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

type Stk = { state: "idle" } | { state: "sending" } | { state: "pending"; id: string; phone: string; amount: number } | { state: "failed"; message: string }
interface MpesaPayment { id: string; status: "pending" | "completed" | "failed" | "refunded"; resultDesc: string | null }
/** The server's M-Pesa test mode lets a developer play the customer. It does not exist against real Safaricom. */
const SHOW_SIMULATOR = process.env.NODE_ENV !== "production"

function PaymentForm({ total, customer, busy, branchId, onClose, onComplete }: Props) {
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

  // The amount box shows the full balance by default; type less to split across methods (e.g. half M-Pesa, half cash).
  const enteredAmount = amount.trim() === "" ? remaining : Number(amount)
  const target = Number.isFinite(enteredAmount) ? Math.min(enteredAmount, remaining) : 0
  const setShare = (fraction: number) => setAmount(String(Math.round(remaining * fraction * 100) / 100))
  const receivedNum = parseFloat(received) || 0
  const change = method === "cash" && receivedNum > target ? receivedNum - target : 0

  const push = (p: PaymentInput) => {
    setPayments((all) => [...all, p])
    setAmount("")
    setReceived("")
    setReference("")
    setError("")
  }

  // While a prompt is on the customer's phone, ask the server for the result every few seconds.
  const pendingId = stk.state === "pending" ? stk.id : null
  const pendingAmount = stk.state === "pending" ? stk.amount : 0
  useEffect(() => {
    if (!pendingId) return
    let stopped = false
    const poll = async () => {
      try {
        const mp = await api<MpesaPayment>(`/payments/mpesa/${pendingId}`)
        if (stopped) return
        if (mp.status === "completed") {
          // The sale references the confirmed M-Pesa payment by its id.
          push({ method: "mobile_money", amount: pendingAmount, reference: pendingId })
          setStk({ state: "idle" })
        } else if (mp.status === "failed") {
          setStk({ state: "failed", message: mp.resultDesc || "The M-Pesa request was cancelled or failed." })
        }
      } catch { /* try again on the next tick */ }
    }
    const timer = setInterval(poll, 3000)
    return () => { stopped = true; clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingId])

  const addPayment = async () => {
    if (remaining <= 0) return
    if (target <= 0) return setError("Enter an amount.")
    if (method === "cash") {
      // Nothing typed means the customer handed over exactly the amount.
      const got = receivedNum || target
      if (got < target) return setError("Cash received is less than the amount.")
      setCashTendered((c) => c + got)
      return push({ method: "cash", amount: target })
    }
    if (method === "mobile_money") {
      if (!/^(\+?254|0)[17]\d{8}$/.test(phone.replace(/\s/g, ""))) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.")
      setError("")
      setStk({ state: "sending" })
      try {
        const mp = await api<MpesaPayment>("/payments/mpesa/stk", { method: "POST", body: { phone: phone.replace(/s/g, ""), amount: target, ...(branchId ? { branchId } : {}) } })
        setStk({ state: "pending", id: mp.id, phone, amount: target })
      } catch (e) {
        setStk({ state: "idle" })
        setError(errorMessage(e, "Could not send the M-Pesa request."))
      }
      return
    }
    push({ method, amount: target, reference: reference.trim() || undefined })
  }

  const simulate = async (success: boolean) => {
    if (stk.state !== "pending") return
    try {
      await api(`/payments/mpesa/${stk.id}/simulate`, { method: "POST", body: { success } })
    } catch (e) {
      setError(errorMessage(e, "Could not simulate the customer."))
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
              <Input label={method === "mobile_money" ? "Amount to request" : "Amount"} type="number" min="0" step={100} value={amount === "" ? String(remaining) : amount} onChange={(e) => setAmount(e.target.value)} />
              {method === "cash" && <Input label="Cash received" type="number" min="0" step={100} value={received} onChange={(e) => setReceived(e.target.value)} placeholder={String(Math.ceil(target))} />}
              {method === "mobile_money" && <Input label="Customer phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />}
              {(method === "card" || method === "bank_transfer") && <Input label={method === "card" ? "Approval code (optional)" : "Reference (optional)"} value={reference} onChange={(e) => setReference(e.target.value)} />}
            </div>
            {remaining > 1 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-500">Pay with {label(method)}:</span>
                <button onClick={() => setAmount("")} className={`rounded-full border px-3 py-1 ${amount === "" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}>Full {formatCurrency(remaining)}</button>
                <button onClick={() => setShare(0.5)} className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">Half {formatCurrency(Math.round(remaining * 50) / 100)}</button>
              </div>
            )}
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

        {stk.state === "sending" && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"><Loader2 className="h-4 w-4 animate-spin" />Sending the M-Pesa request…</div>
        )}
        {stk.state === "pending" && (
          <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
            <p className="text-sm font-medium text-green-800">M-Pesa request for {formatCurrency(stk.amount)} sent to {stk.phone}</p>
            <p className="text-xs text-green-700">Waiting for the customer to enter their PIN. This screen updates by itself.</p>
            {SHOW_SIMULATOR && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => simulate(true)}><CheckCircle2 className="h-4 w-4" />Test mode: customer paid</Button>
                <Button size="sm" variant="secondary" onClick={() => simulate(false)}>Test mode: customer declined</Button>
              </div>
            )}
            <Button size="sm" variant="secondary" onClick={() => setStk({ state: "idle" })}>Cancel request</Button>
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
            {customer.name}: credit available {formatCurrency(available)}{canUseAccount ? " - you can put the balance on their account." : " - not enough to cover the balance."}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Back</Button>
          {remaining === 0 ? (
            <Button className="flex-1" size="lg" onClick={finish} isLoading={busy}>Complete sale</Button>
          ) : (
            <Button className="flex-1" size="lg" disabled={!canUseAccount || stk.state === "pending" || stk.state === "sending" || busy} onClick={finish} isLoading={busy}>
              Put {formatCurrency(remaining)} on account
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
