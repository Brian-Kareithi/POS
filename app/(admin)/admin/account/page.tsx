"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminApi } from "@/lib/api/admin"
import { errorMessage } from "@/lib/api/client"
import { useAuthStore } from "@/lib/stores/auth-store"
import { notify } from "@/lib/toast"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PasswordInput, PasswordStrength } from "@/components/auth/password-input"

export default function AdminAccountPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [again, setAgain] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (next.length < 8) return setError("The new password must be at least 8 characters.")
    if (next !== again) return setError("The new passwords don't match.")
    setBusy(true)
    try {
      await adminApi.changePassword(current, next)
      notify.success("Password changed", "Please sign in again.")
      await useAuthStore.getState().logout()
      router.push("/login")
    } catch (err) {
      setError(errorMessage(err, "Could not change the password."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="My account" description={user ? `${user.name} · ${user.email}` : undefined} />
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold text-gray-900">Change password</h2><p className="text-xs text-gray-500">You will be signed out everywhere afterwards.</p></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <PasswordInput label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <div><PasswordInput label="New password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /><PasswordStrength value={next} /></div>
            <PasswordInput label="Confirm new password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="rounded-full" isLoading={busy} disabled={!current || !next}>Change password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
