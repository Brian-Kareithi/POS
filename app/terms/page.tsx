import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { APP_NAME } from "@/lib/constants"
import { PlatformLogo } from "@/components/brand/brand-logo"

export const metadata: Metadata = { title: `Terms & Conditions - ${APP_NAME}` }

// Placeholder wording for development. Replace it with terms reviewed by a lawyer before launch.
const UPDATED = "1 January 2026"

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. About these terms",
    body: [
      `These terms govern your use of ${APP_NAME} (the "System"), a cloud point-of-sale service operated by Example Systems Ltd ("we", "us"). By creating an account, signing in, or using the System on behalf of a business, you agree to them. If you do not agree, please do not use the System.`,
      "These are sample terms written for demonstration. Nothing here is legal advice, and they will be replaced before the System is offered to the public.",
    ],
  },
  {
    title: "2. Who may use the System",
    body: [
      "You must be at least 18 years old and able to enter a binding agreement. Business owners are responsible for everyone they invite or approve, including managers, cashiers and other staff.",
      "Employees may only use the System with the permission of their employer, and only for that employer's business.",
    ],
  },
  {
    title: "3. Accounts and security",
    body: [
      "Keep your password private and do not share your account. Everything done through your account is treated as done by you, and the business keeps an audit record of important actions.",
      "Tell the business owner, or us, right away if you think someone else has used your account. We may suspend an account to protect the business or the platform.",
    ],
  },
  {
    title: "4. The business's data",
    body: [
      "The business owns the sales, stock, customer and staff records it enters into the System. We store and process them only to run the service, to keep it secure, and as required by law.",
      "Owners are responsible for entering accurate records, for keeping their tax and receipt settings correct, and for having a lawful reason to hold their customers' and employees' personal information.",
    ],
  },
  {
    title: "5. Acceptable use",
    body: [
      "Do not use the System to break the law, to record sales you did not make, to access another business's data, to interfere with the service, or to try to bypass its security or permission rules.",
      "Staff must not use the System to change prices, discounts, stock or cash records in a way their role does not allow, or to hide missing money.",
    ],
  },
  {
    title: "6. Payments and mobile money",
    body: [
      "Card and mobile money payments are handled by third-party providers such as Safaricom (M-Pesa). Their terms and fees apply. We are not a bank, and we are not responsible for delays or failures on a provider's side.",
    ],
  },
  {
    title: "7. Logos and uploaded content",
    body: [
      "A business may upload its logo. It may only upload images it has the right to use, and the logo is shown only to people signed in to that business. We may remove content that breaks these terms.",
    ],
  },
  {
    title: "8. Availability and offline use",
    body: [
      "We work to keep the System available but cannot promise it will never be interrupted. Sales rung up while the connection is down are stored on the device and uploaded when it returns; keep the device safe until they have synced.",
    ],
  },
  {
    title: "9. Suspension and ending your use",
    body: [
      "We may suspend or close a business account that breaks these terms, is not paid for, or puts others at risk. An owner may ask us to close their account at any time. We will keep records for as long as the law requires.",
    ],
  },
  {
    title: "10. Liability",
    body: [
      "The System is provided \"as is\". To the extent the law allows, we are not liable for lost profits, lost sales, or indirect losses, and our total liability is limited to the fees the business paid us in the three months before the problem arose.",
    ],
  },
  {
    title: "11. Changes and contact",
    body: [
      "We may update these terms and will say so in the System. Using it after a change means you accept the new terms. Questions? Write to support@example.com.",
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-black dark:via-[#06110a] dark:to-[#0a2415] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] bg-white px-6 py-8 shadow-xl shadow-blue-900/5 ring-1 ring-black/5 dark:ring-white/10 sm:px-12 sm:py-12">
        <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50">
          <ArrowLeft className="h-4 w-4" />Back
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-blue-50"><PlatformLogo className="h-8 w-8" /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Terms &amp; Conditions</h1>
            <p className="text-sm text-gray-500">Last updated {UPDATED}</p>
          </div>
        </div>
        <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Sample terms for development. They are fictional and will be replaced with reviewed terms before launch.
        </p>
        <div className="mt-8 space-y-7">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
              {s.body.map((p) => <p key={p} className="mt-2 text-sm leading-7 text-gray-600">{p}</p>)}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
