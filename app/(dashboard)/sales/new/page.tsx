"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useDataStore } from "@/lib/stores/data-store"
import { useCartStore } from "@/lib/stores/cart-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils/format"
import { generateId, generateOrderNumber } from "@/lib/utils/generators"
import { PAYMENT_METHODS } from "@/lib/constants"
import type { PaymentMethod } from "@/lib/types"
import { Plus, Minus, Trash2, Search, X, Barcode, User, ShoppingCart, Percent } from "lucide-react"

export default function NewSalePage() {
  const router = useRouter()
  const { products, customers, sales, addSale, addNotification } = useDataStore()
  const cart = useCartStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showCoupon, setShowCoupon] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [paidAmount, setPaidAmount] = useState("")

  const filteredProducts = useMemo(() =>
    products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  )

  const filteredCustomers = useMemo(() =>
    customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase())),
    [customers, customerSearch]
  )

  const subtotal = cart.getSubtotal()
  const taxTotal = cart.getTaxTotal()
  const discountTotal = cart.getDiscountTotal()
  const total = cart.getTotal()
  const itemCount = cart.getItemCount()

  const handleCheckout = () => {
    const sale = {
      id: generateId(),
      businessId: "",
      branchId: "",
      customerId: cart.customerId,
      userId: "",
      orderNumber: generateOrderNumber(),
      status: "completed" as const,
      subtotal,
      taxTotal,
      discountTotal,
      total,
      paidAmount: parseFloat(paidAmount) || total,
      changeAmount: Math.max(0, (parseFloat(paidAmount) || total) - total),
      paymentMethod: cart.paymentMethod,
      notes: cart.notes,
      items: cart.items.map((i) => ({
        id: generateId(),
        saleId: "",
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        tax: i.tax,
        total: i.total,
      })),
      payments: [{
        id: generateId(),
        saleId: "",
        method: cart.paymentMethod,
        amount: total,
        status: "completed" as const,
        createdAt: new Date().toISOString(),
      }],
      customer: customers.find((c) => c.id === cart.customerId),
      createdAt: new Date().toISOString(),
    }
    addSale(sale)
    addNotification({
      id: generateId(),
      userId: "",
      title: "New Sale Completed",
      message: `Sale ${sale.orderNumber} for ${formatCurrency(total)} completed.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    })
    cart.clearCart()
    router.push(`/sales/${sale.id}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Sale" description="Create a new point of sale transaction">
        <Button variant="secondary" onClick={() => setShowProductSearch(true)}>
          <Search className="h-4 w-4" />Search Products
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Cart ({itemCount} items)</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCustomerSelect(true)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <User className="h-4 w-4" />{cart.customerName || "Walk-in Customer"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cart.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Cart is empty. Search and add products.</p>
                  <Button variant="secondary" className="mt-4" onClick={() => setShowProductSearch(true)}>
                    <Plus className="h-4 w-4" />Add Items
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Item</TableHead><TableHead>Price</TableHead><TableHead>Qty</TableHead><TableHead>Discount</TableHead><TableHead>Total</TableHead><TableHead className="w-12"></TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.sku}</p>
                        </TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} className="rounded p-0.5 text-gray-400 hover:text-gray-600"><Minus className="h-3 w-3" /></button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} className="rounded p-0.5 text-gray-400 hover:text-gray-600"><Plus className="h-3 w-3" /></button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.discount} onChange={(e) => cart.updateDiscount(item.id, parseFloat(e.target.value) || 0)} className="w-20 h-8 text-sm" />
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                        <TableCell>
                          <button onClick={() => cart.removeItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-gray-900">Summary</h3></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{formatCurrency(taxTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-red-600">-{formatCurrency(discountTotal)}</span></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>

              <div className="pt-4 space-y-3">
                <Select label="Payment Method" options={PAYMENT_METHODS.map((p) => ({ value: p.value, label: p.label }))} value={cart.paymentMethod} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => cart.setPaymentMethod(e.target.value as PaymentMethod)} />
                <Input label="Amount Paid" type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={formatCurrency(total)} />
                {parseFloat(paidAmount) > total && (
                  <p className="text-sm text-green-600">Change: {formatCurrency(parseFloat(paidAmount) - total)}</p>
                )}
                <Input label="Notes" value={cart.notes} onChange={(e) => cart.setNotes(e.target.value)} placeholder="Optional notes" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => setShowCoupon(true)} variant="secondary" className="flex-1"><Percent className="h-4 w-4" />Coupon</Button>
              </div>

              <Button className="w-full mt-2" size="lg" disabled={cart.items.length === 0} onClick={handleCheckout}>
                Complete Sale ({formatCurrency(total)})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showProductSearch} onClose={() => setShowProductSearch(false)} title="Add Products" size="xl">
        <SearchInput placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <div className="mt-4 max-h-96 overflow-y-auto space-y-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">{product.sku} - {formatCurrency(product.sellingPrice)}</p>
              </div>
              <Button size="sm" onClick={() => { cart.addItem(product); setShowProductSearch(false) }}><Plus className="h-3 w-3" />Add</Button>
            </div>
          ))}
          {filteredProducts.length === 0 && <p className="text-center text-gray-500 py-4">No products found</p>}
        </div>
      </Dialog>

      <Dialog open={showCustomerSelect} onClose={() => setShowCustomerSelect(false)} title="Select Customer" size="md">
        <SearchInput placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
          <button onClick={() => { cart.setCustomer("", ""); setShowCustomerSelect(false) }} className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm text-gray-700">Walk-in Customer</button>
          {filteredCustomers.map((c) => (
            <button key={c.id} onClick={() => { cart.setCustomer(c.id, c.name); setShowCustomerSelect(false) }} className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <p className="text-sm font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500">{c.email} • {c.phone}</p>
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog open={showCoupon} onClose={() => setShowCoupon(false)} title="Apply Coupon" size="sm">
        <div className="space-y-4">
          <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <Button className="w-full" onClick={() => { if (couponCode) { cart.setCoupon(couponCode, subtotal * 0.1); setShowCoupon(false) } }}>Apply</Button>
        </div>
      </Dialog>
    </div>
  )
}
