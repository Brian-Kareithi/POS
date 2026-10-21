"use client"

import { useCallback, useEffect, useState } from "react"
import { Coffee, LogIn, LogOut, Play, Timer } from "lucide-react"
import { api, errorMessage } from "@/lib/api/client"
import { notify } from "@/lib/toast"
import { formatMinutes } from "@/lib/utils/format"
import type { WorkSession } from "@/lib/types"

/** Clock in / break / clock out. Hours worked = time on the clock minus breaks, which is what the owner sees. */
export function ClockWidget() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const [session, setSession] = useState<WorkSession | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setSession((await api<{ session: WorkSession | null }>("/time/current")).session)
    } catch { /* offline: keep what we last knew */ }
    setReady(true)
  }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when the page opens
  useEffect(() => { void load() }, [load])

  const act = async (path: string, body: object = {}) => {
    setBusy(true)
    try {
      const res = await api<WorkSession | { session: WorkSession | null }>(path, { method: "POST", body })
      setSession("session" in res ? res.session : res)
    } catch (e) {
      notify.error("Could not update your time", errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null
  const base = "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-60"

  if (!session) {
    return <button disabled={busy} onClick={() => act("/time/clock-in")} className={`${base} bg-green-50 text-green-700 hover:bg-green-100`} title="Start your working day"><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Clock in</span></button>
  }
  // elapsed on the clock, minus finished breaks and the one running now
  const start = new Date(session.clockInAt).getTime()
  const breakMs = session.breaks.reduce((s, b) => s + ((b.endedAt ? new Date(b.endedAt).getTime() : now) - new Date(b.startedAt).getTime()), 0)
  const worked = Math.max(0, Math.round((now - start - breakMs) / 60000))

  return (
    <div className="flex items-center gap-1">
      <span className="hidden items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-xs text-gray-600 md:flex" title="Hours worked today, breaks not counted">
        <Timer className="h-4 w-4 text-gray-400" />{formatMinutes(worked)}
      </span>
      {session.onBreak
        ? <button disabled={busy} onClick={() => act("/time/break/end")} className={`${base} bg-amber-50 text-amber-700 hover:bg-amber-100`}><Play className="h-4 w-4" /><span className="hidden sm:inline">End break</span></button>
        : <button disabled={busy} onClick={() => act("/time/break/start")} className={`${base} bg-gray-50 text-gray-700 hover:bg-gray-100`}><Coffee className="h-4 w-4" /><span className="hidden sm:inline">Break</span></button>}
      <button disabled={busy} onClick={() => act("/time/clock-out")} className={`${base} bg-red-50 text-red-700 hover:bg-red-100`}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Clock out</span></button>
    </div>
  )
}
