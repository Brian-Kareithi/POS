"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/ui/search-input"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { Dialog } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { generateId, generateOrderNumber } from "@/lib/utils/generators"
import { ArrowLeft, FileText, Plus, Trash2, CheckCircle2, DollarSign } from "lucide-react"

interface QuoteItemDraft {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export default function SalesQuotesPage() {
  const router = useRouter()
  const { sales, products, customers, addSale, updateSale, removeSale, addNotification } = useDataStore()
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState("")
  const [quoteItems, setQuoteItems] = useState<QuoteItemDraft[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("1")

  const quotes = useMemo(() => sales.filter((s) => s.status === "pending"), [sales])
  const filtered = useMemo(() => quotes.filter((s) =>
    s.orderNumber.toLowerCase().includes(search.toLowerCase())
  ), [quotes, search])

  const totalQuoted = quotes.reduce((sum, s) => sum + s.total, 0)

  const addItemToQuote = () => {
    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return
    const qty = Math.max(1, parseInt(quantity) || 1)
    const existing = quoteItems.find((i) => i.productId === product.id)
    if (existing) {
      setQuoteItems((items) => items.map((i) =>
        i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
      ))
    } else {
      setQuoteItems((items) => [...items, {
        productId: product.id,
        name: product.name,
        quantity: qty,
        unitPrice: product.sellingPrice,
      }])
    }
    setSelectedProduct("")
    setQuantity("1")
  }

  const quoteSubtotal = quoteItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const quoteTax = quoteSubtotal * 0.16
  const quoteTotal = quoteSubtotal + quoteTax

  const saveQuote = () => {
    if (quoteItems.length === 0) return
    addSale({
      id: generateId(),
      businessId: "",
      branchId: "",
      customerId: customerId || undefined,
      userId: "",
      orderNumber: generateOrderNumber(),
      status: "pending",
      subtotal: quoteSubtotal,
      taxTotal: quoteTax,
      discountTotal: 0,
      total: quoteTotal,
      paidAmount: 0,
      changeAmount: 0,
      paymentMethod: "cash",
      notes: "Quote awaiting confirmation",
      items: quoteItems.map((i) => ({
        id: generateId(),
        saleId: "",
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: 0,
        tax: i.unitPrice * i.quantity * 0.16,
        total: i.unitPrice * i.quantity * 1.16,
      })),
      customer: customers.find((c) => c.id === customerId),
      createdAt: new Date().toISOString(),
    })
    setShowNew(false)
    setQuoteItems([])
    setCustomerId("")
  }

  const convertToSale = (id: string) => {
    const quote = sales.find((s) => s.id === id)
    if (!quote) return
    updateSale(id, { status: "completed" })
    addNotification({
      id: generateId(),
      userId: "",
      title: "Quote Converted to Sale",
      message: `Quote ${quote.orderNumber} for ${formatCurrency(quote.total)} was converted to a sale.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    })
    router.push(`/sales/${id}`)
  }

  const confirmDelete = () => {
    if (showDelete) removeSale(showDelete)
    setShowDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Quotes" description={`${quotes.length} open quotes`}>
        <Link href="/sales"><Button variant="secondary"><ArrowLeft className="h-4 w-4" />Back to Sales</Button></Link>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" />New Quote</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Open Quotes" value={quotes.length.toString()} icon={FileText} />
        <StatsCard title="Quoted Value" value={formatCurrency(totalQuoted)} icon={DollarSign} />
        <StatsCard title="Average Quote" value={quotes.length > 0 ? formatCurrency(totalQuoted / quotes.length) : "$0.00"} icon={FileText} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search by order number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Quote #</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="p-0">
                <EmptyState icon={<FileText className="h-12 w-12" />} title="No quotes yet" description="Create a quote to share with a customer before they commit." action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" />New Quote</Button>} />
              </TableCell></TableRow>
            ) : filtered.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium"><Link href={`/sales/${quote.id}`} className="text-blue-600 hover:text-blue-700">{quote.orderNumber}</Link></TableCell>
                <TableCell>{quote.customer?.name || "Walk-in"}</TableCell>
                <TableCell>{quote.items?.length || 0}</TableCell>
                <TableCell>{formatCurrency(quote.total)}</TableCell>
                <TableCell><Badge>pending</Badge></TableCell>
                <TableCell className="text-gray-500">{formatDateTime(quote.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button onClick={() => convertToSale(quote.id)} title="Convert to Sale" className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowDelete(quote.id)} title="Delete Quote" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showNew} onClose={() => { setShowNew(false); setQuoteItems([]); setCustomerId("") }} title="New Quote" size="lg">
        <div className="space-y-4">
          <Select label="Customer (optional)" options={customers.map((c) => ({ value: c.id, label: c.name }))} value={customerId} onChange={(e) => setCustomerId(e.target.value)} />

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">Add Items</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select label="Product" options={products.map((p) => ({ value: p.id, label: `${p.name} (${formatCurrency(p.sellingPrice)})` }))} value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} />
              <Input label="Quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <div className="flex items-end">
                <Button type="button" className="w-full" disabled={!selectedProduct} onClick={addItemToQuote}><Plus className="h-4 w-4" />Add</Button>
              </div>
            </div>
          </div>

          {quoteItems.length > 0 && (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {quoteItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    <button onClick={() => setQuoteItems((items) => items.filter((i) => i.productId !== item.productId))} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(quoteSubtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (16%)</span><span>{formatCurrency(quoteTax)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(quoteTotal)}</span></div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowNew(false); setQuoteItems([]); setCustomerId("") }}>Cancel</Button>
            <Button disabled={quoteItems.length === 0} onClick={saveQuote}>Save Quote</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Quote" size="sm">
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this quote? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Dialog>
    </div>
  )
}
