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
import { Card, CardContent } from "@/components/ui/card"

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
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-1 text-xl font-semibold text-gray-900">Sign in</h2>
        <p className="mb-6 text-sm text-gray-500">Enter your credentials to access your account</p>

        {notice && (
          <div
            role={notice.tone === "waiting" ? "status" : "alert"}
            className={notice.tone === "waiting"
              ? "mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              : "mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"}
          >
            {notice.tone === "waiting" && <span className="mb-0.5 block font-semibold">Almost there</span>}
            {notice.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" error={errors.password?.message} {...register("password")} />
          {needsCode && (
            <Input label="Two-factor code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" autoFocus error={errors.totpCode?.message} {...register("totpCode")} />
          )}
          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">Forgot password?</Link>
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Sign in</Button>
        </form>

        <div className="mt-6 space-y-1 text-center text-sm text-gray-500">
          <p>New business? <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">Create one</Link></p>
          <p>Joining a team? Use the join link your employer shared.</p>
        </div>
      </CardContent>
    </Card>
  )
}
