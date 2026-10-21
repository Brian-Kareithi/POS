"use client"

import { DetailSkeleton } from "@/components/ui/skeleton"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, Trash2, LogOut, PauseCircle, PlayCircle, ShieldOff, UserCheck, UserX, XCircle } from "lucide-react"
import { adminApi, STATUS_LABELS, STATUS_VARIANT, when, type AdminBusinessDetail, type AdminUser, type BusinessStatus } from "@/lib/api/admin"
import { errorMessage } from "@/lib/api/client"
import { ROLE_LABELS } from "@/lib/permissions"
import { notify } from "@/lib/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/auth/password-input"

type Action =
  | { kind: "status"; status: BusinessStatus }
  | { kind: "password"; user: AdminUser }
  | { kind: "revoke"; user: AdminUser }
  | { kind: "erase" }

export default function AdminBusinessPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [typed, setTyped] = useState("")
  const [data, setData] = useState<AdminBusinessDetail | null>(null)
  const [error, setError] = useState("")
  const [action, setAction] = useState<Action | null>(null)
  const [reason, setReason] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"set" | "email">("set")
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")

  const load = useCallback(async () => {
    try { setData(await adminApi.business(id)); setError("") }
    catch (e) { setError(errorMessage(e, "Could not load this business.")) }
  }, [id])
  useEffect(() => { void load() }, [load])

  const open = (a: Action) => { setAction(a); setReason(""); setPassword(""); setMode("set"); setFormError(""); setTyped("") }
  const close = () => setAction(null)

  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true); setFormError("")
    try { await work(); notify.success(done); close(); await load() }
    catch (e) { setFormError(errorMessage(e, "That did not work. Please try again.")) }
    finally { setBusy(false) }
  }

  const quick = async (work: () => Promise<unknown>, done: string) => {
    try { await work(); notify.success(done); await load() }
    catch (e) { notify.error("Could not do that", errorMessage(e)) }
  }

  if (error) return <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error} <Link href="/admin/businesses" className="font-semibold underline">Back to businesses</Link></p>
  if (!data) return <DetailSkeleton />
  const b = data.business

  return (
    <div className="space-y-4">
      <Link href="/admin/businesses" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"><ArrowLeft className="h-4 w-4" />All businesses</Link>

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-gray-900">{b.name}</h1><Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABELS[b.status]}</Badge></div>
            <p className="mt-1 text-sm text-gray-600">{b.industryLabel} · {b.currency} · {b.timezone}</p>
            <p className="text-xs text-gray-400">Joined {when(b.createdAt)}{b.email ? ` · ${b.email}` : ""}{b.phone ? ` · ${b.phone}` : ""}</p>
            {b.status !== "active" && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{STATUS_LABELS[b.status]} {when(b.statusChangedAt)}{b.statusReason ? `: ${b.statusReason}` : ""}. Nobody in this business can sign in.</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {b.status === "active" ? (
              <>
                <Button variant="warning" className="rounded-full" onClick={() => open({ kind: "status", status: "suspended" })}><PauseCircle />Suspend</Button>
                <Button variant="danger" className="rounded-full" onClick={() => open({ kind: "status", status: "closed" })}><XCircle />Close account</Button>
              </>
            ) : (
              <Button className="rounded-full" onClick={() => open({ kind: "status", status: "active" })}><PlayCircle />Reactivate</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["People", data.usage.staff], ["Branches", data.usage.branches], ["Products", data.usage.products], ["Sales", data.usage.sales]] as const).map(([label, n]) => (
          <Card key={label} className="rounded-2xl"><CardContent className="py-4"><p className="text-2xl font-bold text-gray-900">{n.toLocaleString()}</p><p className="text-sm text-gray-500">{label}</p></CardContent></Card>
        ))}
      </div>
      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold text-gray-900">Tabs</h2><p className="text-xs text-gray-500">The same switches the owner has in Settings. Switch one off to hide it for everyone in this business.</p></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {b.features.map((f) => (
            <button
              key={f.id} type="button" disabled={f.locked} aria-pressed={!f.hidden}
              title={f.locked ? "Always on" : f.hidden ? "Hidden: click to show" : "Showing: click to hide"}
              onClick={() => void quick(() => adminApi.setFeatures(b.id, f.hidden ? b.hiddenModules.filter((m) => m !== f.id) : [...b.hiddenModules, f.id]), `${f.label} is now ${f.hidden ? "showing" : "hidden"}`)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${f.hidden ? "bg-gray-100 text-gray-400 line-through" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
            >{f.label}</button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><h2 className="font-semibold text-gray-900">People ({data.users.length})</h2></CardHeader>
        <ul className="divide-y divide-gray-100">
          {data.users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{u.name}</span>
                  <Badge variant={u.role === "owner" ? "info" : "default"}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                  {!u.isActive && <Badge variant="danger">Access off</Badge>}
                  {u.approval === "pending" && <Badge variant="warning">Awaiting approval</Badge>}
                  {u.twoFactorEnabled && <Badge variant="success">2FA</Badge>}
                </div>
                <p className="truncate text-sm text-gray-600">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                <p className="text-xs text-gray-400">Last active {when(u.lastLoginAt)}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => open({ kind: "password", user: u })}><KeyRound />Password</Button>
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => void quick(() => adminApi.signOut(u.id), `${u.name} was signed out everywhere`)}><LogOut />Sign out</Button>
                {u.twoFactorEnabled && (
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={() => { if (window.confirm(`Turn off two-factor for ${u.name}? They will need to set it up again.`)) void quick(() => adminApi.resetTwoFactor(u.id), "Two-factor turned off") }}><ShieldOff />Reset 2FA</Button>
                )}
                {u.isActive
                  ? <Button size="sm" variant="danger" className="rounded-full" onClick={() => open({ kind: "revoke", user: u })}><UserX />Revoke</Button>
                  : <Button size="sm" className="rounded-full" onClick={() => void quick(() => adminApi.restore(u.id), `${u.name}'s access was restored`)}><UserCheck />Restore</Button>}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="rounded-2xl border-red-200">
        <CardHeader><h2 className="font-semibold text-red-700">Danger zone</h2></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">Permanently erase this business and everything in it: people, sales, stock, settings and files. This cannot be undone. To keep the data and only lock people out, suspend the business instead.</p>
          <Button variant="danger" className="shrink-0 rounded-full" onClick={() => open({ kind: "erase" })}><Trash2 />Erase business</Button>
        </CardContent>
      </Card>

      {data.adminActivity.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader><h2 className="font-semibold text-gray-900">Your recent actions here</h2></CardHeader>
          <ul className="divide-y divide-gray-100">
            {data.adminActivity.map((a) => (
              <li key={a.id} className="px-6 py-3 text-sm"><span className="font-medium text-gray-900">{a.action}</span> <span className="text-gray-600">{a.detail}</span><span className="block text-xs text-gray-400">{when(a.createdAt)}</span></li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog open={action?.kind === "status"} onClose={close} title={action?.kind === "status" ? (action.status === "active" ? "Reactivate this business?" : action.status === "suspended" ? "Suspend this business?" : "Close this account?") : ""}>
        {action?.kind === "status" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(() => adminApi.setStatus(b.id, action.status, reason.trim() || undefined), `${b.name} is now ${STATUS_LABELS[action.status].toLowerCase()}`) }}>
            <p className="text-sm text-gray-600">
              {action.status === "active" ? "Everyone in the business will be able to sign in again."
                : action.status === "suspended" ? "Everyone in the business is signed out at once and cannot sign in until you reactivate it. Nothing is deleted."
                : "Everyone is signed out and locked out. Their data is kept, and you can reactivate the business later."}
            </p>
            {action.status !== "active" && <Input label="Reason (kept in your activity log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="For example: owner asked to leave" />}
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" className="rounded-full" onClick={close}>Cancel</Button><Button type="submit" variant={action.status === "active" ? "primary" : "danger"} className="rounded-full" isLoading={busy}>{action.status === "active" ? "Reactivate" : action.status === "suspended" ? "Suspend" : "Close account"}</Button></div>
          </form>
        )}
      </Dialog>

      <Dialog open={action?.kind === "erase"} onClose={close} title={`Erase ${b.name}?`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (typed.trim().toLowerCase() !== "delete") return; void (async () => { setBusy(true); setFormError(""); try { await adminApi.erase(b.id, typed); notify.success("Business erased", `${b.name} and all of its data are gone.`); router.replace("/admin/businesses") } catch (err) { setFormError(errorMessage(err, "Could not erase the business.")) } finally { setBusy(false) } })() }}>
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">This permanently erases <strong>{b.name}</strong>, its {data.usage.staff} {data.usage.staff === 1 ? "person" : "people"}, {data.usage.sales.toLocaleString()} sales, {data.usage.products.toLocaleString()} products and every setting and file. It cannot be undone and cannot be recovered from a backup.</p>
          <Input label="Type delete to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="delete" />
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" className="rounded-full" onClick={close}>Cancel</Button><Button type="submit" variant="danger" className="rounded-full" isLoading={busy} disabled={typed.trim().toLowerCase() !== "delete"}>Erase forever</Button></div>
        </form>
      </Dialog>

      <Dialog open={action?.kind === "password"} onClose={close} title={action?.kind === "password" ? `Password for ${action.user.name}` : ""}>
        {action?.kind === "password" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(() => adminApi.resetPassword(action.user.id, mode === "set" ? password : undefined), mode === "set" ? "Password updated" : "Reset link sent") }}>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1 text-sm font-medium">
              {([["set", "Set a password"], ["email", "Email a link"]] as const).map(([m, label]) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-full px-3 py-1.5 ${mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{label}</button>
              ))}
            </div>
            {mode === "set"
              ? <PasswordInput label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              : <p className="text-sm text-gray-600">We email {action.user.email} a link, valid for one hour, so they can choose their own password.</p>}
            <p className="text-xs text-gray-500">They are signed out of every device either way.</p>
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" className="rounded-full" onClick={close}>Cancel</Button><Button type="submit" className="rounded-full" isLoading={busy} disabled={mode === "set" && password.length < 8}>{mode === "set" ? "Set password" : "Send link"}</Button></div>
          </form>
        )}
      </Dialog>

      <Dialog open={action?.kind === "revoke"} onClose={close} title={action?.kind === "revoke" ? `Revoke ${action.user.name}'s access?` : ""}>
        {action?.kind === "revoke" && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(() => adminApi.revoke(action.user.id, reason.trim() || undefined), `${action.user.name}'s access was revoked`) }}>
            <p className="text-sm text-gray-600">They are signed out everywhere and cannot sign in. Their sales and records stay. You can restore access later.</p>
            <Input label="Reason (kept in your activity log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="secondary" className="rounded-full" onClick={close}>Cancel</Button><Button type="submit" variant="danger" className="rounded-full" isLoading={busy}>Revoke access</Button></div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
