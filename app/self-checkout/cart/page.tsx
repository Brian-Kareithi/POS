"use client"

import { useCartStore } from "@/lib/stores/cart-store"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/format"
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const cart = useCartStore()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/self-checkout/scan" className="text-sm text-blue-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4 inline" /> Back</Link>
        <h1 className="text-lg font-semibold text-gray-900">Your Cart ({cart.getItemCount()} items)</h1>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {cart.items.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-gray-500">
            <p>Your cart is empty</p>
            <Link href="/self-checkout/scan"><Button variant="secondary" className="mt-4">Add Items</Button></Link>
          </CardContent></Card>
        ) : cart.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <button onClick={() => cart.removeItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="rounded border border-gray-200 p-1"><Minus className="h-3 w-3" /></button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="rounded border border-gray-200 p-1"><Plus className="h-3 w-3" /></button>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(item.total)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cart.items.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(cart.getTotal())}</span></div>
          <Link href="/self-checkout/payment"><Button className="w-full" size="lg">Proceed to Payment</Button></Link>
        </div>
      )}
    </div>
  )
}
