"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { api } from "@/lib/api/client"
import { authFailure } from "@/lib/api/messages"
import { landingFor } from "@/lib/navigation"
import { notify } from "@/lib/toast"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const registerSchema = z.object({
  businessName: z.string().trim().min(2, "Business name must be at least 2 characters").max(120, "Business name is too long"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z.string().trim().max(30, "Phone number is too long").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })

type Form = z.infer<typeof registerSchema>

/** Owner sign-up: creates the business and its owner account, then signs the owner in. */
export default function RegisterPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const signedIn = useAuthStore((s) => s.isAuthenticated && !!s.token)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(registerSchema) })

  // Someone who already has a session has no business on the sign-up page.
  useEffect(() => {
    if (signedIn) router.replace(landingFor(useAuthStore.getState().user?.role))
  }, [signedIn, router])

  const onSubmit = async (data: Form) => {
    setError(null)
    try {
      await api("/auth/register-business", {
        method: "POST", public: true,
        body: { businessName: data.businessName, name: data.name, email: data.email, password: data.password, ...(data.phone ? { phone: data.phone } : {}) },
      })
    } catch (e) {
      const message = authFailure(e).message
      notify.error("Could not create your business", message)
      return setError(message)
    }
    notify.success("Business created", `Welcome, ${data.name.split(" ")[0]}!`)
    try {
      await login(data.email, data.password)
      router.push(landingFor(useAuthStore.getState().user?.role))
    } catch {
      // The business exists; just send them to sign in.
      notify.info("Your business is ready", "Sign in to continue.")
      router.push("/login")
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-1 text-xl font-semibold text-gray-900">Create your business</h2>
        <p className="mb-6 text-sm text-gray-500">You&apos;ll be the owner. Staff can then join with a link you share.</p>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input label="Business name" autoComplete="organization" placeholder="Jamii Retail" error={errors.businessName?.message} {...register("businessName")} />
          <Input label="Your full name" autoComplete="name" placeholder="Kamau Mwangi" error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" autoComplete="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <Input label="Phone (optional)" type="tel" autoComplete="tel" placeholder="0712 345 678" error={errors.phone?.message} {...register("phone")} />
          <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register("password")} />
          <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={isSubmitting}>Create business</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
