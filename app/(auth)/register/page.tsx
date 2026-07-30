"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSuccess(true)
    setIsLoading(false)
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Registration successful!</h2>
          <p className="text-sm text-gray-500 mb-6">Please check your email to verify your account.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">Go to sign in</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Create account</h2>
        <p className="text-sm text-gray-500 mb-6">Fill in the details to register your business</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" placeholder="John Smith" error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
          <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" className="w-full" isLoading={isLoading}>Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
