"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api/client"
import { authFailure } from "@/lib/api/messages"
import { notify } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const joinSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })

type Form = z.infer<typeof joinSchema>

function JoinForm() {
  const business = useSearchParams().get("business")?.trim().toLowerCase() ?? ""
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(joinSchema) })

  if (!business) {
    return (
      <Card><CardContent className="p-6 text-center">
        <h2 className="mb-1 text-xl font-semibold text-gray-900">Invalid join link</h2>
        <p className="mb-6 text-sm text-gray-500">This join link is invalid. Ask your employer for the correct link.</p>
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
      </CardContent></Card>
    )
  }

  const onSubmit = async (data: Form) => {
    setError(null)
    try {
      // 202: a pending account is created. The person is NOT signed in.
      await api("/auth/register", { method: "POST", public: true, body: { name: data.name, email: data.email, password: data.password, businessSlug: business } })
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
      <Card><CardContent className="p-6 text-center">
        <h2 className="mb-1 text-xl font-semibold text-gray-900">Request sent</h2>
        <p className="mb-6 text-sm text-gray-500">The owner will review it before you can sign in. You&apos;ll be able to sign in once they approve you.</p>
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Back to sign in</Link>
      </CardContent></Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-1 text-xl font-semibold text-gray-900">Request access</h2>
        <p className="mb-6 text-sm text-gray-500">Create your account. The owner approves it and gives you a role before you can sign in.</p>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Request access</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already approved? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function JoinPage() {
  return <Suspense><JoinForm /></Suspense>
}
