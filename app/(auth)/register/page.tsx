"use client"

import { useState } from "react"
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
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = () => {
    setError("Account registration is not enabled in this demo. Please contact your administrator.")
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
          <Input label="Full Name" placeholder="Kamau Mwangi" error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
          <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          <Button type="submit" className="w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
