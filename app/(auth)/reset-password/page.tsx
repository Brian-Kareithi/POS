"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api/client"
import { authFailure } from "@/lib/api/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })
type Form = z.infer<typeof schema>

function ResetForm() {
  const token = useSearchParams().get("token") ?? ""
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setError(null)
    try {
      await api("/auth/reset-password", { method: "POST", public: true, body: { token, password: data.password } })
      setDone(true)
    } catch (e) {
      setError(authFailure(e, "This link has expired or was already used.").message)
    }
  }

  if (!token) {
    return <Card><CardContent className="p-6 text-center"><h2 className="mb-1 text-xl font-semibold text-gray-900">Invalid link</h2><p className="mb-6 text-sm text-gray-500">This link is missing its token. Use the link from your email.</p><Link href="/login" className="text-sm font-medium text-blue-600">Back to sign in</Link></CardContent></Card>
  }
  if (done) {
    return <Card><CardContent className="p-6 text-center"><h2 className="mb-1 text-xl font-semibold text-gray-900">Password saved</h2><p className="mb-6 text-sm text-gray-500">You can sign in now.</p><Link href="/login" className="text-sm font-medium text-blue-600">Go to sign in</Link></CardContent></Card>
  }
  return (
    <Card><CardContent className="p-6">
      <h2 className="mb-1 text-xl font-semibold text-gray-900">Choose a password</h2>
      <p className="mb-6 text-sm text-gray-500">Use at least 8 characters.</p>
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Save password</Button>
      </form>
    </CardContent></Card>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
