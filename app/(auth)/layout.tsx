import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import { LiquidBackground } from "@/components/auth/liquid-background"
import { PlatformLogo } from "@/components/brand/brand-logo"

export const metadata: Metadata = {
  title: `${APP_NAME} - Authentication`,
}

/** Sign-in and sign-up only ever show the platform's logo: no business is known here, and one business's logo must never reach another. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-pos-canvas to-blue-100 dark:from-black dark:via-[#06110a] dark:to-[#0a2415] px-4 py-8 sm:px-6">
      <LiquidBackground />

      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-[2rem] bg-white/95 px-6 pb-8 pt-10 shadow-xl shadow-blue-900/10 ring-1 ring-black/5 backdrop-blur-sm dark:bg-neutral-950/85 dark:shadow-black/50 dark:ring-white/10 sm:px-10 sm:pb-10">
          <div className="mb-6 flex flex-col items-center">
            <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-blue-50 ring-8 ring-blue-50/60 dark:bg-white/5 dark:ring-white/5">
              <PlatformLogo className="h-14 w-14" />
            </span>
            <span className="mt-3 text-sm font-semibold tracking-wide text-gray-500">{APP_NAME}</span>
          </div>
          {children}
        </div>
        <p className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-white/60 px-4 py-2 text-xs text-gray-600 backdrop-blur-sm dark:bg-black/40">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />Your data is private to your business.</span>
          <Link href="/terms" className="font-medium underline underline-offset-2 hover:text-gray-900">Terms &amp; conditions</Link>
        </p>
      </main>
    </div>
  )
}
