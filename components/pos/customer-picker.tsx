"use client"

import { useMemo, useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDataStore } from "@/lib/stores/data-store"
import { generateId } from "@/lib/utils/generators"
import { formatCurrency } from "@/lib/utils/format"
import type { Customer } from "@/lib/types"
import { Plus, Search, UserRound } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (customer: Customer | undefined) => void
}

export function CustomerPicker(props: Props) {
  return props.open ? <Picker {...props} /> : null
}

function Picker({ onClose, onSelect }: Props) {
  const { customers, business, addCustomer, logAudit } = useDataStore()
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return customers.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")))
  }, [customers, query])

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    const customer: Customer = {
      id: generateId(), businessId: business?.id ?? "", name: name.trim(), email: "", phone: phone.trim(),
      loyaltyPoints: 0, storeCredit: 0, creditLimit: 0, amountOwed: 0, marketingConsent: consent, isActive: true, createdAt: new Date().toISOString(),
    }
    addCustomer(customer)
    logAudit("Customer created", "Customer", `${customer.name} added at the till${consent ? " (marketing consent given)" : ""}`)
    onSelect(customer)
  }

  return (
    <Dialog open onClose={onClose} title="Customer" size="md">
      <div className="space-y-3">
        <p className="text-sm text-gray-500">Customers are optional. A walk-in can buy without registering.</p>
        <Button variant="secondary" className="w-full" onClick={() => onSelect(undefined)}><UserRound className="h-4 w-4" />Walk-in customer</Button>
        {!adding ? (
          <>
            <Input icon={<Search className="h-4 w-4" />} placeholder="Search by name or phone" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {matches.map((c) => (
                <button key={c.id} onClick={() => onSelect(c)} className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left hover:bg-gray-50">
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{c.name}</span>
                    <span className="block text-xs text-gray-500">{c.phone}</span>
                  </span>
                  <span className="text-right text-xs text-gray-500">
                    <span className="block">{c.loyaltyPoints.toLocaleString()} pts</span>
                    {(c.amountOwed ?? 0) > 0 && <span className="block text-orange-600">Owes {formatCurrency(c.amountOwed ?? 0)}</span>}
                  </span>
                </button>
              ))}
              {matches.length === 0 && <p className="py-4 text-center text-sm text-gray-500">No customer found.</p>}
            </div>
            <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />New customer</Button>
          </>
        ) : (
          <form onSubmit={create} className="space-y-3">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />
            <label className="flex items-start gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              The customer agrees to receive receipts and offers by SMS.
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>Back</Button>
              <Button type="submit" className="flex-1">Save and select</Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  )
}
