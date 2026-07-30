"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

const quickUsers = [
  { email: "owner@mainstreetretail.com", label: "Owner / Director", role: "owner", color: "bg-blue-600 hover:bg-blue-700" },
  { email: "sales1@mainstreetretail.com", label: "Sales Person", role: "sales_person", color: "bg-gray-700 hover:bg-gray-800" },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "owner@mainstreetretail.com", password: "password" },
  })

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      await login(data.email, data.password)
      router.push("/")
    } catch {
      setError("Invalid email or password")
    }
  }

  const quickSignIn = async (email: string) => {
    setQuickLoading(email)
    setError(null)
    try {
      await login(email, "password")
      router.push("/")
    } catch {
      setError("Sign in failed")
    }
    setQuickLoading(null)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials to access your account</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">Quick sign in as</p>
          <div className="flex flex-col gap-2">
            {quickUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => quickSignIn(user.email)}
                disabled={quickLoading === user.email}
                className={`${user.color} text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {quickLoading === user.email ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                {user.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
