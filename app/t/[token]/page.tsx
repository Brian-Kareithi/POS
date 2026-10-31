"use client"

import "./guest-tab.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ApiError, errorMessage } from "@/lib/api/client"
import { guestTab, type GuestTab } from "@/lib/api/tabs"
import { Cat, type CatState } from "@/components/brand/cat"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { BellRing, CheckCircle2, Loader2, Printer, Receipt, Smartphone, WifiOff } from "lucide-react"

const PHONE_KEY = "guest-tab-phone"
const POLL_MS = 4000
const POLL_PAYING_MS = 2500

const methodName: Record<string, string> = { cash: "Cash", card: "Card", bank_transfer: "Bank transfer", mobile_money: "M-Pesa", credit: "On account" }

const readPhone = () => { try { return localStorage.getItem(PHONE_KEY) ?? "" } catch { return "" } }
const savePhone = (v: string) => { try { localStorage.setItem(PHONE_KEY, v) } catch { /* private mode: fine */ } }

function useMoney(currency: string | undefined) {
  return useMemo(() => {
    let f: Intl.NumberFormat
    try { f = new Intl.NumberFormat("en-KE", { style: "currency", currency: currency || "KES", minimumFractionDigits: 2 }) }
    catch { f = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 2 }) }
    return (n: number) => f.format(n)
  }, [currency])
}

const clock = (iso: string) => new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

function Stage({ cat, title, text }: { cat: CatState; title: string; text: string }) {
  return (
    <div className="gt flex flex-col items-center justify-center px-6 text-center">
      <ThemeToggle className="fixed right-3 top-3 z-30" />
      <Cat state={cat} className="w-40" />
      <h1 className="mt-4 text-xl font-bold text-[var(--gt-ink)]">{title}</h1>
      <p className="mt-1 max-w-xs text-sm text-[var(--gt-ink-soft)]">{text}</p>
    </div>
  )
}

/**
 * What a guest opens after scanning the QR code on their table. It can only be read, with one exception: the pay button.
 * Everything shown comes from the server, which also decides what is owed.
 */
export default function GuestTabPage() {
  const token = useParams().token as string
  const [tab, setTab] = useState<GuestTab | null>(null)
  const [missing, setMissing] = useState(false)
  const [offline, setOffline] = useState(false)
  const [phone, setPhone] = useState(readPhone)
  const [stage, setStage] = useState<"idle" | "sending" | "waiting">("idle")
  const [error, setError] = useState("")
  const [calling, setCalling] = useState<"" | "bill" | "waiter" | "done">("")
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  const [updatedAt, setUpdatedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  // The first few seconds after the paper feeds out, lines print in one by one; afterwards only new lines do.
  const [settled, setSettled] = useState(false)
  const seen = useRef<Map<string, number> | null>(null)
  const freshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stageRef = useRef(stage)
  useEffect(() => { stageRef.current = stage })

  const loadRef = useRef<() => Promise<void>>(async () => {})

  // Keep the bill live: a server adds a round and it prints onto the guest's phone a few seconds later.
  useEffect(() => {
    const load = async () => {
      try {
        const next = await guestTab.get(token)
        setOffline(false)
        setUpdatedAt(Date.now())
        // Work out which lines are new since the last look, so those (and only those) print in again.
        const before = seen.current
        const after = new Map<string, number>()
        const newOnes = new Set<number>()
        next.items.forEach((it, i) => {
          after.set(it.name, it.quantity)
          if (before && (before.get(it.name) ?? 0) < it.quantity) newOnes.add(i)
        })
        seen.current = after
        if (newOnes.size) {
          setFresh(newOnes)
          if (freshTimer.current) clearTimeout(freshTimer.current)
          freshTimer.current = setTimeout(() => setFresh(new Set()), 2600)
        }
        if (next.payment?.status === "failed" && stageRef.current === "waiting") {
          setStage("idle")
          setError(next.payment.message || "The M-Pesa payment did not go through. You have not been charged.")
        }
        if (next.status !== "open") setStage("idle")
        setTab(next)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) setMissing(true)
        else setOffline(true)
      }
    }
    loadRef.current = load
    void load()
    const every = stage === "waiting" ? POLL_PAYING_MS : POLL_MS
    const poll = setInterval(() => { if (document.visibilityState === "visible" && (!tab || tab.status === "open" || stage === "waiting")) void load() }, every)
    const onShow = () => { if (document.visibilityState === "visible") void load() }
    document.addEventListener("visibilitychange", onShow)
    return () => { clearInterval(poll); document.removeEventListener("visibilitychange", onShow) }
  }, [token, stage, tab?.status]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => () => { if (freshTimer.current) clearTimeout(freshTimer.current) }, [])

  const money = useMoney(tab?.business.currency)
  const printing = tab !== null ? (tab.status === "closed" ? "receipt" : "bill") : null
  useEffect(() => {
    if (!printing) return
    const t = setTimeout(() => setSettled(true), 2800)
    return () => { clearTimeout(t); setSettled(false) }
  }, [printing])

  if (missing) return <Stage cat="sad" title="This tab link is not valid" text="It may have been replaced or expired. Ask your server for the QR code again." />
  if (!tab) return <Stage cat="idle" title="Opening your tab…" text="One moment." />
  if (tab.status === "cancelled") return <Stage cat="sad" title="This tab was cancelled" text="If that is a surprise, please check with your server." />

  const paid = tab.status === "closed" && !!tab.receipt
  const lines = paid ? tab.receipt!.items : tab.items
  const paying = stage === "waiting" || stage === "sending" || tab.payment?.status === "pending"
  const catState: CatState = paid ? "happy" : tab.payment?.status === "failed" && !paying ? "sad" : "idle"
  const ago = Math.max(0, Math.round((now - updatedAt) / 1000))

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = phone.replace(/\s/g, "")
    if (!/^(\+?254|0)[17]\d{8}$/.test(cleaned)) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.")
    setError("")
    setStage("sending")
    try {
      await guestTab.pay(token, cleaned)
      savePhone(phone)
      setStage("waiting")
    } catch (err) {
      setStage("idle")
      setError(errorMessage(err, "Could not send the M-Pesa request."))
      void loadRef.current()
    }
  }

  const call = async (reason: "bill" | "waiter") => {
    setCalling(reason)
    try { await guestTab.call(token, reason); setCalling("done") } catch (err) { setCalling(""); setError(errorMessage(err, "Could not reach your server.")) }
  }

  return (
    <div className="gt px-4 pb-20 pt-5">
      <ThemeToggle className="fixed right-3 top-3 z-30" />
      <div className="mx-auto w-full max-w-[420px]">
        <div className="no-print mb-1 flex items-center justify-center gap-2 text-xs">
          {paid ? (
            <span className="gt-pill"><CheckCircle2 className="h-3.5 w-3.5" />Paid. Thank you!</span>
          ) : offline ? (
            <span className="gt-pill is-warn"><WifiOff className="h-3.5 w-3.5" />Reconnecting…</span>
          ) : (
            <span className="gt-pill"><i />Live · updated {ago < 5 ? "just now" : `${ago}s ago`}</span>
          )}
        </div>

        <div className="gt-perch"><Cat state={catState} lookAt="pointer" bowtie /></div>
        <div className="gt-printer" aria-hidden="true">
          <span className="gt-brand">Tab printer</span>
          <span className={`gt-led ${paying ? "is-busy" : "is-on"}`} />
          <span className="gt-slot" />
        </div>

        <div className="gt-feed">
          <article key={paid ? "receipt" : "bill"} className="gt-paper" aria-live="polite" aria-label={paid ? "Your receipt" : "Your tab"}>
            {paid && <span className="gt-stamp" aria-hidden="true">Paid</span>}

            <header className="gt-center">
              <p className="gt-biz">{tab.business.name}</p>
              {tab.branch && <p className="gt-soft">{tab.branch}</p>}
              {tab.business.address && <p className="gt-soft">{tab.business.address}</p>}
              {tab.business.phone && <p className="gt-soft">Tel {tab.business.phone}</p>}
            </header>

            <hr className="gt-rule" />
            <div className="gt-row"><span className="gt-soft">{paid ? "Receipt" : "Tab"}</span><strong>{paid ? tab.receipt!.receiptNumber : tab.label}</strong></div>
            <div className="gt-row"><span className="gt-soft">{paid ? "Paid" : "Opened"}</span><span>{clock(paid ? tab.receipt!.paidAt : tab.openedAt)}</span></div>
            {paid && <div className="gt-row"><span className="gt-soft">Table / guest</span><span>{tab.label}</span></div>}
            <hr className="gt-rule" />

            {lines.length === 0 ? (
              <p className="gt-center gt-soft gt-line" style={{ animationDelay: "700ms" }}>Nothing ordered yet.<br />Items appear here as your server adds them.</p>
            ) : (
              <ul className="space-y-2">
                {lines.map((it, i) => (
                  <li key={`${it.name}-${i}`} className={`gt-line gt-row${fresh.has(i) ? " is-new" : ""}`} style={{ animationDelay: settled ? undefined : `${650 + i * 110}ms` }}>
                    <span>
                      {it.name}
                      <br /><span className="gt-qty">{it.quantity} × {money(it.unitPrice)}</span>
                    </span>
                    <span>{money(it.total)}</span>
                  </li>
                ))}
              </ul>
            )}

            <hr className="gt-rule" />
            {paid ? (
              <div className="space-y-1">
                <div className="gt-row"><span className="gt-soft">Subtotal</span><span>{money(tab.receipt!.subtotal)}</span></div>
                {tab.receipt!.discountTotal > 0 && <div className="gt-row"><span className="gt-soft">Discount</span><span>-{money(tab.receipt!.discountTotal)}</span></div>}
                <div className="gt-row"><span className="gt-soft">VAT</span><span>{money(tab.receipt!.taxTotal)}</span></div>
                <div className="gt-row gt-total"><span>TOTAL</span><span>{money(tab.receipt!.total)}</span></div>
                <div className="gt-row"><span className="gt-soft">Paid with {methodName[tab.receipt!.paymentMethod] ?? tab.receipt!.paymentMethod}</span><span>{money(tab.receipt!.paidAmount)}</span></div>
                {tab.receipt!.changeAmount > 0 && <div className="gt-row"><span className="gt-soft">Change</span><span>{money(tab.receipt!.changeAmount)}</span></div>}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="gt-row"><span className="gt-soft">Subtotal</span><span>{money(tab.subtotal)}</span></div>
                <div className="gt-row"><span className="gt-soft">VAT</span><span>{money(tab.taxTotal)}</span></div>
                <div key={tab.total} className="gt-row gt-total gt-flash"><span>TO PAY</span><span>{money(tab.total)}</span></div>
              </div>
            )}

            {(tab.footerText || paid) && (
              <>
                <hr className="gt-rule" />
                <p className="gt-center gt-soft">{tab.footerText ?? "Thank you for visiting. See you again!"}</p>
                {tab.kraPin && <p className="gt-center gt-soft">PIN {tab.kraPin}</p>}
              </>
            )}
            {paid && <div className="gt-barcode" aria-hidden="true" />}
          </article>
        </div>

        {!paid && (
          <section className="gt-actions mt-7 space-y-3">
            {tab.canPay ? (
              <form onSubmit={pay} className="space-y-3 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <label className="block text-sm font-medium text-[var(--gt-ink)]" htmlFor="guest-phone">M-Pesa number</label>
                <input
                  id="guest-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} disabled={stage !== "idle"}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50 dark:border-white/10 dark:bg-black/30 dark:text-white"
                />
                {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                {stage === "waiting" && (
                  <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />Check your phone and enter your M-Pesa PIN. This page updates by itself.
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full" isLoading={stage === "sending"} disabled={stage !== "idle"}>
                  <Smartphone className="h-5 w-5" />Pay {money(tab.total)} with M-Pesa
                </Button>
              </form>
            ) : (
              <div className="rounded-2xl border border-black/5 bg-white/80 p-4 text-center text-sm text-[var(--gt-ink-soft)] dark:border-white/10 dark:bg-white/5">
                {tab.total > 0 ? "Please settle this tab with your server." : "Your bill will appear here as you order."}
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => call("bill")} disabled={calling === "bill" || paying}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 text-sm font-medium text-[var(--gt-ink)] hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/5">
                <Receipt className="h-4 w-4" />Bring the bill
              </button>
              <button type="button" onClick={() => call("waiter")} disabled={calling === "waiter" || paying}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 text-sm font-medium text-[var(--gt-ink)] hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-white/5">
                <BellRing className="h-4 w-4" />Call my server
              </button>
            </div>
            {calling === "done" && <p role="status" className="text-center text-sm text-[var(--gt-green)]">Your server has been told. They are on their way.</p>}
            <p className="text-center text-xs text-[var(--gt-ink-soft)]">This page is a live, read-only view of your tab. Only you and your server can see it.</p>
          </section>
        )}

        {paid && (
          <section className="gt-actions mt-7 text-center">
            <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-5 text-sm font-medium text-[var(--gt-ink)] hover:bg-white dark:border-white/10 dark:bg-white/5">
              <Printer className="h-4 w-4" />Save or print receipt
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
