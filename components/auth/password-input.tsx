"use client"

import { forwardRef, useState } from "react"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string
  error?: string
}

/** A password field with a show/hide button, so people can check what they typed (especially on a phone). */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(({ className, ...props }, ref) => {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={shown ? "text" : "password"} icon={<Lock className="h-4 w-4" />} className={`pr-11 ${className ?? ""}`} {...props} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        tabIndex={-1}
        className="absolute right-2 top-[29px] grid h-7 w-7 place-items-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
})
PasswordInput.displayName = "PasswordInput"

/** A quick read on how strong a new password is. Guidance only; the server enforces the real rule. */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const score = [value.length >= 8, value.length >= 12, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length
  const level = value.length < 8 ? 0 : score <= 2 ? 1 : score === 3 ? 2 : 3
  const labels = ["Too short", "Okay", "Good", "Strong"]
  const colors = ["bg-red-500", "bg-amber-500", "bg-lime-500", "bg-green-600"]
  return (
    <div className="mt-1.5" aria-live="polite">
      <div className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= level ? colors[level] : "bg-gray-200"}`} />)}</div>
      <p className="mt-1 text-xs text-gray-500">Password strength: {labels[level]}</p>
    </div>
  )
}
