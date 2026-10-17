import type { Metadata } from "next"
import { APP_NAME } from "@/lib/constants"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export const metadata: Metadata = {
  title: `${APP_NAME} - Authentication`,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <ThemeToggle className="absolute right-3 top-3" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Point of Sale System</p>
        </div>
        {children}
      </div>
    </div>
  )
}
