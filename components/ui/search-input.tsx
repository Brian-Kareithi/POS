"use client"

import { forwardRef } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, onChange, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
            className
          )}
          onChange={(e) => {
            onChange?.(e)
            onSearch?.(e.target.value)
          }}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"
export { SearchInput }
