"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api/client"
import { authFailure } from "@/lib/api/messages"
import { notify } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput, PasswordStrength } from "@/components/auth/password-input"
import { TermsCheckbox } from "@/components/auth/terms-checkbox"
import { AuthAlert, AuthHeading } from "@/components/auth/auth-heading"
import { CheckCircle2, Mail, UserRound } from "lucide-react"

const STEPS = ["Send your request", "The owner approves you and picks your role", "Sign in and start work"]

/** "acme-stores" becomes "Acme Stores", so the person can see which business they are asking to join. */
const prettySlug = (slug: string) => slug.split("-").filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ")

function Steps({ done }: { done: number }) {
  return (
    <ol className="mt-6 space-y-3">
      {STEPS.map((text, i) => (
        <li key={text} className="flex items-center gap-3 text-sm">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${i < done ? "bg-blue-600 text-white" : i === done ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300" : "bg-gray-100 text-gray-400"}`}>{i < done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}</span>
          <span className={i <= done ? "font-medium text-gray-900" : "text-gray-400"}>{text}</span>
        </li>
      ))}
    </ol>
  )
}

const joinSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((v) => v, "You need to accept the terms and conditions to request access"),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })

type Form = z.infer<typeof joinSchema>

function JoinForm() {
  const business = useSearchParams().get("business")?.trim().toLowerCase() ?? ""
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(joinSchema) })
  const password = useWatch({ control, name: "password" }) ?? ""

  if (!business) {
    return (
      <div className="text-center">
        <AuthHeading title="Invalid join link" subtitle="This join link is invalid. Ask your employer for the correct link." />
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
      </div>
    )
  }

  const onSubmit = async (data: Form) => {
    setError(null)
    try {
      // 202: a pending account is created. The person is NOT signed in.
      await api("/auth/register", { method: "POST", public: true, body: { name: data.name, email: data.email, password: data.password, businessSlug: business, acceptTerms: true } })
      setDone(true)
      notify.success("Request sent", "The owner will review it.")
    } catch (e) {
      const message = authFailure(e).message
      notify.error("Could not send your request", message)
      setError(message)
    }
  }

  if (done) {
    return (
      <div>
        <span className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600"><CheckCircle2 className="h-6 w-6" /></span>
        <AuthHeading title="Request sent" subtitle="The owner will review it before you can sign in. You'll be able to sign in once they approve you." />
        <Steps done={1} />
        <Link href="/login" className="mt-8 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Joining {prettySlug(business)}</p>
      <AuthHeading title="Request access" subtitle="Create your account. The owner approves it and gives you a role before you can sign in." />
      {error && <AuthAlert>{error}</AuthAlert>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Full name" autoComplete="name" icon={<UserRound className="h-4 w-4" />} placeholder="Wanjiru Kamau" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" autoComplete="email" icon={<Mail className="h-4 w-4" />} placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <div>
          <PasswordInput label="Password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
          <PasswordStrength value={password} />
        </div>
        <PasswordInput label="Confirm password" autoComplete="new-password" placeholder="Type it again" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <TermsCheckbox error={errors.acceptTerms?.message} {...register("acceptTerms")} />
        <Button type="submit" size="lg" className="w-full rounded-full" isLoading={isSubmitting} disabled={isSubmitting}>Request access</Button>
      </form>
      <Steps done={0} />
      <p className="mt-6 text-center text-sm text-gray-500">
        Already approved? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
      </p>
    </div>
  )
}

export default function JoinPage() {
  return <Suspense><JoinForm /></Suspense>
}
