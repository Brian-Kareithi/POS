"use client"

import { useState } from "react"
import QRCodeLib from "qrcode"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCode } from "@/components/ui/qr-code"
import { guestUrl, tabs, type Tab } from "@/lib/api/tabs"
import { errorMessage } from "@/lib/api/client"
import { notify } from "@/lib/toast"
import { Copy, ExternalLink, Printer, RefreshCw, ScanLine } from "lucide-react"

interface Props {
  tab: Tab | null
  onClose: () => void
  onChanged: (tab: Tab) => void
}

/** The QR code a guest scans to follow their tab on their own phone. */
export function TabShareDialog({ tab, onClose, onChanged }: Props) {
  return tab ? <Share key={tab.id + tab.sharePath} tab={tab} onClose={onClose} onChanged={onChanged} /> : null
}

function Share({ tab, onClose, onChanged }: { tab: Tab; onClose: () => void; onChanged: (tab: Tab) => void }) {
  const url = guestUrl(tab)
  const [busy, setBusy] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify.success("Link copied", "Paste it into WhatsApp or a message.") }
    catch { notify.warning("Could not copy", url) }
  }

  // A table card: opens a clean page with just the QR code, so the printer does not get the whole app.
  const printCard = async () => {
    const esc = (v: string) => v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
    try {
      const img = await QRCodeLib.toDataURL(url, { margin: 2, width: 640, errorCorrectionLevel: "M" })
      const w = window.open("", "_blank", "width=480,height=640")
      if (!w) return notify.warning("Allow pop-ups to print", "Your browser blocked the print window.")
      w.document.write(`<!doctype html><title>${esc(tab.label)}</title><body style="font-family:system-ui,sans-serif;text-align:center;margin:32px"><h1 style="margin:0 0 4px">${esc(tab.label)}</h1><p style="margin:0 0 16px;color:#555">Scan to see your tab and pay</p><img src="${img}" style="width:320px;height:320px" alt="QR code"></body>`)
      w.document.close()
      w.focus()
      w.onload = () => w.print()
      setTimeout(() => w.print(), 400)
    } catch (e) {
      notify.error("Could not prepare the card", errorMessage(e))
    }
  }

  const replace = async () => {
    if (!window.confirm(`Replace the link for ${tab.label}? The old QR code will stop working.`)) return
    setBusy(true)
    try {
      const next = await tabs.rotateLink(tab.id)
      onChanged(next)
      notify.success("New link ready", "Show the guest the new QR code.")
    } catch (e) {
      notify.error("Could not replace the link", errorMessage(e))
    } finally { setBusy(false) }
  }

  return (
    <Dialog open onClose={onClose} title={`Guest QR · ${tab.label}`} size="sm">
      <div className="space-y-4 text-center">
        <div className="tab-qr-card mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <QRCode value={url} size={220} />
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500"><ScanLine className="h-3.5 w-3.5" />Scan to see your tab and pay</p>
          <p className="text-sm font-bold text-gray-900">{tab.label}</p>
        </div>
        <p className="text-xs text-gray-500">The guest sees their bill update live and can pay with M-Pesa. They cannot change anything on the tab.</p>
        <p className="break-all rounded-lg bg-gray-50 px-3 py-2 text-left font-mono text-[11px] text-gray-600">{url}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={copy}><Copy />Copy link</Button>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><ExternalLink className="h-4 w-4" />Preview</a>
          <Button variant="secondary" onClick={printCard}><Printer />Print table card</Button>
          <Button variant="secondary" onClick={replace} isLoading={busy}><RefreshCw />New link</Button>
        </div>
      </div>
    </Dialog>
  )
}
