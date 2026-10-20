"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api/client"
import { Card, CardContent } from "@/components/ui/card"
import { Mail } from "lucide-react"

function Verify() {
  const token = useSearchParams().get("token")
  const [state, setState] = useState<"working" | "ok" | "failed" | "missing">(token ? "working" : "missing")

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api("/auth/verify-email", { method: "POST", public: true, body: { token } })
      .then(() => !cancelled && setState("ok"))
      .catch(() => !cancelled && setState("failed"))
    return () => { cancelled = true }
  }, [token])

  const text = {
    working: ["Verifying your email…", "One moment."],
    ok: ["Email verified", "Thanks. Your email address is confirmed."],
    failed: ["Could not verify", "This link has expired or was already used."],
    missing: ["Invalid link", "This link is missing its token. Use the link from your email."],
  }[state]

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"><Mail className="h-6 w-6 text-blue-600" /></div>
        <h2 className="mb-1 text-xl font-semibold text-gray-900">{text[0]}</h2>
        <p className="mb-6 text-sm text-gray-500">{text[1]}</p>
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Go to sign in</Link>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return <Suspense><Verify /></Suspense>
}
