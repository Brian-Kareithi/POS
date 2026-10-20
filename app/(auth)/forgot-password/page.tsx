"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api/client"
import { authFailure } from "@/lib/api/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const schema = z.object({ email: z.string().trim().email("Enter a valid email address") })
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setError(null)
    try {
      await api("/auth/forgot-password", { method: "POST", public: true, body: { email: data.email } })
      setSent(true)
    } catch (e) {
      setError(authFailure(e).message)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        {sent ? (
          <div className="text-center">
            <h2 className="mb-1 text-xl font-semibold text-gray-900">Check your email</h2>
            <p className="mb-6 text-sm text-gray-500">If that email has an account, a reset link is on its way.</p>
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-semibold text-gray-900">Reset password</h2>
            <p className="mb-6 text-sm text-gray-500">Enter your email and we&apos;ll send you a link to choose a new password.</p>
            {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input label="Email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
              <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Send reset link</Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
