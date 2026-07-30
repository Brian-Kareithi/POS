"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const schema = z.object({ email: z.string().email("Invalid email") })
type Form = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 1000))
    setSent(true)
  }

  return (
    <Card>
      <CardContent className="p-6">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">We&apos;ve sent a password reset link to your email.</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Reset password</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
              <Button type="submit" className="w-full">Send reset link</Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Back to sign in</Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
