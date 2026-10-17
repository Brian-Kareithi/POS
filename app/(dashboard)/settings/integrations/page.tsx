"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { notify } from "@/lib/toast"
import { useDataStore } from "@/lib/stores/data-store"
import { Smartphone, FileCheck2, Printer, ScanLine, CreditCard, BookOpen, ShoppingBag } from "lucide-react"

export default function IntegrationsPage() {
  const logAudit = useDataStore((s) => s.logAudit)
  const [mpesa, setMpesa] = useState({ connected: true, shortcode: "174379", till: "5123456" })
  const [etims, setEtims] = useState({ connected: true, pin: "P051234567X", serial: "KRAMW0012345" })
  const [scan, setScan] = useState("")
  const [scanned, setScanned] = useState("")

  const toggle = (name: string, on: boolean, set: (v: boolean) => void) => {
    set(on)
    logAudit(`${name} ${on ? "connected" : "disconnected"}`, "Integration", `${name} was ${on ? "connected" : "disconnected"}`, on ? "info" : "warning")
    if (on) notify.success(`${name} connected`)
    else notify.warning(`${name} disconnected`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description="Payments, tax, printers and scanners" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Smartphone className="h-5 w-5 text-blue-600" />M-Pesa (Daraja)</h3><Badge variant={mpesa.connected ? "success" : "default"}>{mpesa.connected ? "Connected" : "Not connected"}</Badge></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">Cashiers send an STK push to the customer&apos;s phone and the sale completes when they pay. Failed, cancelled and duplicate attempts never record a sale.</p>
            <div className="grid grid-cols-2 gap-3"><Input label="Paybill / shortcode" value={mpesa.shortcode} onChange={(e) => setMpesa({ ...mpesa, shortcode: e.target.value })} /><Input label="Till number" value={mpesa.till} onChange={(e) => setMpesa({ ...mpesa, till: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => notify.success("Test request sent", "A KES 1 request was sent to the shop's test number.")} disabled={!mpesa.connected}>Send test request</Button>
              <Button variant={mpesa.connected ? "secondary" : "primary"} onClick={() => toggle("M-Pesa", !mpesa.connected, (v) => setMpesa({ ...mpesa, connected: v }))}>{mpesa.connected ? "Disconnect" : "Connect"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><FileCheck2 className="h-5 w-5 text-blue-600" />KRA eTIMS</h3><Badge variant={etims.connected ? "success" : "default"}>{etims.connected ? "Connected" : "Not connected"}</Badge></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">Every receipt carries an eTIMS reference and QR code so your sales are ready for tax filing.</p>
            <div className="grid grid-cols-2 gap-3"><Input label="Business KRA PIN" value={etims.pin} onChange={(e) => setEtims({ ...etims, pin: e.target.value })} /><Input label="Device serial" value={etims.serial} onChange={(e) => setEtims({ ...etims, serial: e.target.value })} /></div>
            <Button variant={etims.connected ? "secondary" : "primary"} onClick={() => toggle("eTIMS", !etims.connected, (v) => setEtims({ ...etims, connected: v }))}>{etims.connected ? "Disconnect" : "Connect"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><ScanLine className="h-5 w-5 text-blue-600" />Barcode scanner</h3></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">USB and Bluetooth scanners work with no setup: they type the code and press Enter. Phones and tablets can scan with the camera. Click the box below and scan something to test.</p>
            <Input value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && scan.trim()) { setScanned(scan.trim()); setScan("") } }} placeholder="Scan a barcode here" />
            {scanned && <p className="text-sm font-medium text-green-600">Scanner is working. Read: {scanned}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Printer className="h-5 w-5 text-blue-600" />Receipt printer</h3></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">Receipts print at 80 mm width to any printer set up on this computer, including thermal printers.</p>
            <Button variant="secondary" onClick={() => window.print()}>Print a test page</Button>
          </CardContent>
        </Card>

        {[{ icon: CreditCard, name: "Card payment terminal", text: "Take card payments on a connected terminal." }, { icon: BookOpen, name: "Accounting software", text: "Send sales and expenses to your accountant's software." }, { icon: ShoppingBag, name: "Online store", text: "Keep stock in sync with your online shop." }].map(({ icon: Icon, name, text }) => (
          <Card key={name}>
            <CardHeader className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Icon className="h-5 w-5 text-gray-400" />{name}</h3><Badge>Coming soon</Badge></CardHeader>
            <CardContent><p className="text-sm text-gray-500">{text}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
