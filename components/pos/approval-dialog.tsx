"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useDataStore } from "@/lib/stores/data-store"
import { APPROVAL_PIN } from "@/lib/permissions"
import { ShieldCheck } from "lucide-react"

interface Props {
  open: boolean
  title: string
  description?: string
  reasons?: string[]
  /** When true the person must enter a manager's PIN before continuing. */
  needsApproval: boolean
  confirmLabel?: string
  onClose: () => void
  onConfirm: (result: { reason: string; approvedBy?: string }) => void
}

export function ApprovalDialog(props: Props) {
  return props.open ? <ApprovalForm {...props} /> : null
}

function ApprovalForm({ title, description, reasons, needsApproval, confirmLabel = "Confirm", onClose, onConfirm }: Props) {
  const users = useDataStore((s) => s.users)
  const [reason, setReason] = useState(reasons?.[0] ?? "")
  const [other, setOther] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalReason = reason === "Other" ? other.trim() : reason
    if (reasons && !finalReason) return setError("Please give a reason.")
    let approvedBy: string | undefined
    if (needsApproval) {
      if (pin !== APPROVAL_PIN) return setError("Wrong PIN. Ask a manager to enter theirs.")
      approvedBy = (users.find((u) => u.role === "manager") ?? users.find((u) => u.role === "owner"))?.name ?? "Manager"
    }
    onConfirm({ reason: finalReason, approvedBy })
  }

  return (
    <Dialog open onClose={onClose} title={title} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {reasons && (
          <>
            <Select label="Reason" options={[...reasons, "Other"].map((r) => ({ value: r, label: r }))} value={reason} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value)} />
            {reason === "Other" && <Input label="Describe the reason" value={other} onChange={(e) => setOther(e.target.value)} autoFocus />}
          </>
        )}
        {needsApproval && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700"><ShieldCheck className="h-4 w-4" />Manager approval needed</p>
            <Input label="Manager PIN" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Demo PIN: 1234" autoFocus={!reasons} />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{confirmLabel}</Button>
        </div>
      </form>
    </Dialog>
  )
}
