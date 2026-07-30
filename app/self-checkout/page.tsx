"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, ShoppingCart, Scan, CreditCard } from "lucide-react"

export default function SelfCheckoutPage() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase())

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Self Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Scan, pay, and go</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-6 w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              <QrCode className="h-24 w-24 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Scan this QR code with your phone</p>
            <p className="text-xs text-gray-400">Session: {sessionId}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/self-checkout/scan">
            <Card className="hover:border-gray-300 cursor-pointer">
              <CardContent className="p-4 text-center">
                <Scan className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-900">Scan Items</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/self-checkout/cart">
            <Card className="hover:border-gray-300 cursor-pointer">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-900">View Cart</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Link href="/self-checkout/payment">
          <Button className="w-full" size="lg">
            <CreditCard className="h-5 w-5" />Proceed to Payment
          </Button>
        </Link>
      </div>
    </div>
  )
}
