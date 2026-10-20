"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Smartphone, FileCheck2, Printer, ScanLine, CreditCard, BookOpen, ShoppingBag } from "lucide-react"

export default function IntegrationsPage() {
  const [scan, setScan] = useState("")
  const [scanned, setScanned] = useState("")

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description="Payments, tax, printers and scanners" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Smartphone className="h-5 w-5 text-blue-600" />M-Pesa (Daraja)</h3><Badge>Set up on the server</Badge></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">Cashiers send an STK push to the customer&apos;s phone and the sale only completes once M-Pesa confirms the payment. Failed, cancelled and duplicate attempts never record a sale.</p>
            <p className="text-sm text-gray-500">The Safaricom shortcode, passkey and keys are kept in your server&apos;s environment, not in this app. Until they are added, the server runs a test mode where a developer plays the customer.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><FileCheck2 className="h-5 w-5 text-blue-600" />KRA eTIMS</h3><Badge variant="warning">Not live</Badge></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-500">Sales are queued for eTIMS and stamped with a placeholder reference (starting with STUB-). Nothing is sent to KRA yet.</p>
            <p className="text-sm text-gray-500">Your KRA PIN on receipts is set under Receipt Settings. A real eTIMS device connection has to be added to the server before you rely on this for tax filing.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><ScanLine className="h-5 w-5 text-blue-600" />Barcode scanner</h3></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">USB and Bluetooth scanners work with no setup: they type the code and press Enter. Phones and tablets can scan with the camera. Click the box below and scan something to test.</p>
            <Input label="Scanner test" value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && scan.trim()) { setScanned(scan.trim()); setScan("") } }} placeholder="Scan a barcode here" />
            {scanned && <p role="status" className="text-sm font-medium text-green-600">Scanner is working. Read: {scanned}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><Printer className="h-5 w-5 text-blue-600" />Receipt printer</h3></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">Receipts print to any printer set up on this computer, including thermal printers. Paper size is chosen under Receipt Settings.</p>
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
