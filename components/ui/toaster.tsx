"use client"

import { Toaster as Sonner } from "sonner"
import { AlertTriangle, CheckCircle2, Info, XCircle, Loader2 } from "lucide-react"
import { useUIStore } from "@/lib/stores/ui-store"

/**
 * App-wide toasts, top right. Colours follow the POS green theme:
 * success = brand green, warning = amber, error = red, info = neutral card with a green icon.
 */
export function Toaster() {
  const theme = useUIStore((s) => s.theme)
  const dark = theme === "dark"

  const vars = {
    "--normal-bg": dark ? "#111111" : "#ffffff",
    "--normal-border": dark ? "#222222" : "#e5e7eb",
    "--normal-text": dark ? "#eeeeee" : "#111827",
    "--success-bg": dark ? "#0b2414" : "#eef7f1",
    "--success-border": dark ? "#14452a" : "#b8dec4",
    "--success-text": dark ? "#7ee2a1" : "#066f28",
    "--warning-bg": dark ? "#241a0b" : "#fff7ed",
    "--warning-border": dark ? "#5c3b0c" : "#fed7aa",
    "--warning-text": dark ? "#f5b869" : "#c2410c",
    "--error-bg": dark ? "#240b0b" : "#fef2f2",
    "--error-border": dark ? "#5c1414" : "#fecaca",
    "--error-text": dark ? "#f48b8b" : "#b91c1c",
    "--info-bg": dark ? "#111111" : "#ffffff",
    "--info-border": dark ? "#222222" : "#e5e7eb",
    "--info-text": dark ? "#eeeeee" : "#111827",
    "--border-radius": "12px",
  } as React.CSSProperties

  return (
    <Sonner
      position="top-right"
      theme={dark ? "dark" : "light"}
      richColors
      closeButton
      visibleToasts={4}
      duration={4500}
      offset={{ top: 76, right: 16 }}
      mobileOffset={{ top: 64, right: 12, left: 12 }}
      style={vars}
      toastOptions={{
        classNames: {
          toast: "font-sans shadow-lg",
          title: "text-sm font-semibold",
          description: "text-xs opacity-80",
          actionButton: "bg-blue-600 text-white",
        },
      }}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
        warning: <AlertTriangle className="h-5 w-5 text-orange-500" />,
        error: <XCircle className="h-5 w-5 text-red-600" />,
        info: <Info className="h-5 w-5 text-blue-600" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
      }}
    />
  )
}
