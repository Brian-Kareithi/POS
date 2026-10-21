import type { Metadata } from "next"
import { ShieldCheck, Store } from "lucide-react"
import { APP_NAME } from "@/lib/constants"

export const metadata: Metadata = {
  title: `${APP_NAME} - Authentication`,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-pos-canvas to-blue-100 px-4 py-8 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-300/30 blur-3xl" />

      <main className="relative w-full max-w-md">
        <div className="rounded-[2rem] bg-white px-6 pb-8 pt-10 shadow-xl shadow-blue-900/5 ring-1 ring-black/5 sm:px-10 sm:pb-10">
          <div className="mb-6 flex flex-col items-center">
            <span className="grid h-24 w-24 place-items-center rounded-full bg-blue-50 ring-8 ring-blue-50/60">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-pos-brand text-white shadow-lg shadow-blue-600/30">
                <Store className="h-7 w-7" />
              </span>
            </span>
            <span className="mt-3 text-sm font-semibold tracking-wide text-gray-500">{APP_NAME}</span>
          </div>
          {children}
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4" />Your data is private to your business and every change is logged.
        </p>
      </main>
    </div>
  )
}
