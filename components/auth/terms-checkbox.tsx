"use client"

import { forwardRef } from "react"
import Link from "next/link"

interface Props extends React.InputHTMLAttributes<HTMLInputElement> { error?: string }

/** "I accept the terms": the box is part of the form, the link opens the terms in a new tab so nobody loses what they typed. */
export const TermsCheckbox = forwardRef<HTMLInputElement, Props>(({ error, ...props }, ref) => (
  <div>
    <label className="flex cursor-pointer items-start gap-3 text-sm text-gray-600">
      <input ref={ref} type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500" aria-invalid={!!error} {...props} />
      <span>
        I have read and accept the{" "}
        <Link href="/terms" target="_blank" rel="noopener" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700">terms and conditions</Link>.
      </span>
    </label>
    {error && <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
  </div>
))
TermsCheckbox.displayName = "TermsCheckbox"
