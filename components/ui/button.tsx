"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils/cn"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const base = "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0"
    const variants = {
      primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
      secondary: "bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900",
      danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
      ghost: "text-gray-600 hover:bg-gray-100",
      success: "bg-green-600 text-white shadow-sm hover:bg-green-700",
      warning: "bg-orange-500 text-white shadow-sm hover:bg-orange-600",
    }
    const sizes = {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2 [&_svg]:h-5 [&_svg]:w-5",
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"
export { Button }
