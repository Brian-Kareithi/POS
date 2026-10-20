"use client"

import { Toaster as Sonner } from "sonner"

/** Top-right toast stack. The look of each toast lives in lib/toast.tsx. */
export function Toaster() {
  return <Sonner position="top-right" visibleToasts={3} offset={{ top: 16, right: 16 }} mobileOffset={{ top: 12, right: 12 }} gap={8} />
}
