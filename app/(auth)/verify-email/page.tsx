"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false)

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Verify your email</h2>
        <p className="text-sm text-gray-500 mb-2">We&apos;ve sent a verification link to your email address.</p>
        <p className="text-sm text-gray-500 mb-6">Please check your inbox and click the link to verify.</p>
        <Button
          variant="secondary"
          onClick={() => { setResent(true); setTimeout(() => setResent(false), 3000) }}
        >
          {resent ? "Sent!" : "Resend verification email"}
        </Button>
        <div className="mt-6">
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">Back to sign in</Link>
        </div>
      </CardContent>
    </Card>
  )
}
