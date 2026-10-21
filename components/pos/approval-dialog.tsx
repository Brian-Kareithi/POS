"use client"

import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { verifyApprovalPin } from "@/lib/api/approvals"
import { errorMessage } from "@/lib/api/client"
import { ShieldCheck } from "lucide-react"

interface Props {
  open: boolean
  title: string
  description?: string
  reasons?: string[]
  /** When true the person must enter a manager's PIN before continuing. */
  needsApproval: boolean
  confirmLabel?: string
  /** Extra content shown above the reason, for example which items to refund. */
  children?: React.ReactNode
  /** Keeps the confirm button off until the extra content is filled in. */
  confirmDisabled?: boolean
  size?: "sm" | "md" | "lg"
  onClose: () => void
  onConfirm: (result: { reason: string; approvedBy?: string; approvalToken?: string }) => void | Promise<void>
}

export function ApprovalDialog(props: Props) {
  return props.open ? <ApprovalForm {...props} /> : null
}

function ApprovalForm({ title, description, reasons, needsApproval, confirmLabel = "Confirm", children, confirmDisabled, size = "sm", onClose, onConfirm }: Props) {
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState(reasons?.[0] ?? "")
  const [other, setOther] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalReason = reason === "Other" ? other.trim() : reason
    if (reasons && !finalReason) return setError("Please give a reason.")
    setBusy(true)
    setError("")
    try {
      let approvedBy: string | undefined
      let approvalToken: string | undefined
      if (needsApproval) {
        if (!pin) return setError("Ask a manager to enter their PIN.")
        const approval = await verifyApprovalPin(pin)
        approvedBy = approval.approver.name
        approvalToken = approval.approvalToken
      }
      await onConfirm({ reason: finalReason, approvedBy, approvalToken })
    } catch (err) {
      setError(errorMessage(err, "Could not confirm that."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title={title} size={size}>
      <form onSubmit={submit} className="space-y-4">
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {children}
        {reasons && (
          <>
            <Select label="Reason" options={[...reasons, "Other"].map((r) => ({ value: r, label: r }))} value={reason} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value)} />
            {reason === "Other" && <Input label="Describe the reason" value={other} onChange={(e) => setOther(e.target.value)} autoFocus />}
          </>
        )}
        {needsApproval && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700"><ShieldCheck className="h-4 w-4" />Manager approval needed</p>
            <Input label="Manager PIN" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Manager's approval PIN" autoFocus={!reasons} />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={busy} disabled={confirmDisabled}>{confirmLabel}</Button>
        </div>
      </form>
    </Dialog>
  )
}
