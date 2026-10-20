import type { Metadata } from "next"
import { BarChart3, Clock, ShieldCheck, Smartphone, Store } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export const metadata: Metadata = {
  title: `${APP_NAME} - Authentication`,
}

const POINTS = [
  { icon: Store, title: "Sell faster", text: "Scan, charge and print receipts in seconds, even when the network drops." },
  { icon: BarChart3, title: "Know your numbers", text: "Sales, profit and stock across every branch, live." },
  { icon: Clock, title: "Cash you can trust", text: "Every sale belongs to a shift, so missing money can be traced." },
  { icon: Smartphone, title: "M-Pesa ready", text: "Take mobile money payments right at the till." },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-pos-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25"><Store className="h-5 w-5" /></span>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Run your shop with confidence.</h1>
          <p className="mt-3 text-base leading-7 text-white/80">Point of sale, stock and staff in one place, built for busy Kenyan retailers.</p>
          <ul className="mt-10 space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15"><Icon className="h-[18px] w-[18px]" /></span>
                <span><span className="block text-sm font-semibold">{title}</span><span className="block text-sm leading-6 text-white/75">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-white/70"><ShieldCheck className="h-4 w-4" />Your data is private to your business and every change is logged.</p>
      </aside>

      <main className="relative flex flex-col justify-center bg-white px-5 py-14 sm:px-10">
        <ThemeToggle className="absolute right-3 top-3" />
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-pos-brand text-white"><Store className="h-[18px] w-[18px]" /></span>
            <span className="text-base font-bold text-gray-900">{APP_NAME}</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
