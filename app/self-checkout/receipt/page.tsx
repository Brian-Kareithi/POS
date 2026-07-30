"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Printer, Download, Home } from "lucide-react"
import Link from "next/link"

export default function ReceiptPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Receipt</h2>
            <p className="text-xs text-gray-400 mt-1">Order #ORD-2407-8932</p>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{new Date().toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">$0.00</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">Completed</span></div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1"><Printer className="h-4 w-4" />Print</Button>
            <Button variant="secondary" className="flex-1"><Download className="h-4 w-4" />Download</Button>
          </div>
          <Link href="/self-checkout"><Button className="w-full"><Home className="h-4 w-4" />Back to Start</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
