"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { landingFor } from "@/lib/navigation"
import { authFailure, type Tone } from "@/lib/api/messages"
import { notify } from "@/lib/toast"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/auth/password-input"
import { AuthAlert, AuthHeading } from "@/components/auth/auth-heading"
import { Mail, ShieldCheck } from "lucide-react"

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  totpCode: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code").optional().or(z.literal("")),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [notice, setNotice] = useState<{ tone: Tone; message: string } | null>(null)
  const [needsCode, setNeedsCode] = useState(false)
  const signedIn = useAuthStore((s) => s.isAuthenticated && !!s.token)

  // Someone who already has a session has no business on the sign-in page.
  useEffect(() => {
    if (signedIn) router.replace(landingFor(useAuthStore.getState().user?.role))
  }, [signedIn, router])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setNotice(null)
    try {
      await login(data.email, data.password, data.totpCode || undefined)
      notify.success("Welcome back", useAuthStore.getState().user?.name)
      router.push(landingFor(useAuthStore.getState().user?.role))
    } catch (e) {
      const failure = authFailure(e)
      if (failure.code === "TOTP_REQUIRED") setNeedsCode(true)
      setNotice({ tone: failure.tone, message: failure.message })
      if (failure.tone === "error" && failure.code !== "TOTP_REQUIRED") notify.error("Could not sign in", failure.message)
      else if (failure.tone === "waiting") notify.info("Waiting for approval", "The owner has not approved your account yet.")
    }
  }

  return (
    <div>
      <AuthHeading title="Welcome back" subtitle="Sign in to open your till, check your shop and keep things moving." />

      {notice && (
        <AuthAlert tone={notice.tone === "waiting" ? "waiting" : "error"} title={notice.tone === "waiting" ? "Almost there" : undefined}>{notice.message}</AuthAlert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" icon={<Mail className="h-4 w-4" />} placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
        <PasswordInput label="Password" autoComplete="current-password" placeholder="Enter your password" error={errors.password?.message} {...register("password")} />
        {needsCode && (
          <Input label="Two-factor code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} icon={<ShieldCheck className="h-4 w-4" />} placeholder="123456" autoFocus error={errors.totpCode?.message} {...register("totpCode")} />
        )}
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" className="w-full rounded-full" isLoading={isSubmitting} disabled={isSubmitting}>Sign in</Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />Or<span className="h-px flex-1 bg-gray-200" />
      </div>

      <Link href="/register" className="flex w-full items-center justify-center rounded-full border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-blue-300 hover:bg-blue-50">
        Create a business account
      </Link>
      <p className="mt-6 text-center text-xs text-gray-500">Joining a team? Use the join link your employer shared.</p>
    </div>
  )
}
