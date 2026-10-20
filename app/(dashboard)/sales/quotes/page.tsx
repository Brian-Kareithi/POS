"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDataStore } from "@/lib/stores/data-store"
import { api, errorMessage, newIdempotencyKey } from "@/lib/api/client"
import { toSale } from "@/lib/api/mappers"
import { refresh } from "@/lib/api/sync"
import { notify } from "@/lib/toast"
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
import { ArrowLeft, FileText, Plus, Trash2, CheckCircle2, DollarSign } from "lucide-react"

interface QuoteItemDraft {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  taxRate: number
}

interface Quote {
  id: string
  number: string
  customerId: string | null
  lines: { productId: string; quantity: number }[]
  total: number
  status: "open" | "converted" | "discarded"
  validUntil: string | null
  createdAt: string
}

const CONVERT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
]

export default function SalesQuotesPage() {
  const router = useRouter()
  const { products, customers } = useDataStore()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [converting, setConverting] = useState<Quote | null>(null)
  const [method, setMethod] = useState("cash")
  const [busy, setBusy] = useState(false)
  const [customerId, setCustomerId] = useState("")
  const [quoteItems, setQuoteItems] = useState<QuoteItemDraft[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("1")

  const load = async () => {
    try {
      setLoadError("")
      const res = await api<{ data: Quote[] }>("/quotes", { query: { status: "open", limit: 200 } })
      setQuotes(res.data)
    } catch (e) {
      setLoadError(errorMessage(e, "Could not load quotes."))
    }
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => quotes.filter((q) => q.number.toLowerCase().includes(search.toLowerCase())), [quotes, search])
  const totalQuoted = quotes.reduce((sum, q) => sum + Number(q.total), 0)
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Item"

  const addItemToQuote = () => {
    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return
    const qty = Math.max(1, parseInt(quantity) || 1)
    setQuoteItems((items) =>
      items.some((i) => i.productId === product.id)
        ? items.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i))
        : [...items, { productId: product.id, name: product.name, quantity: qty, unitPrice: product.sellingPrice, taxRate: product.taxRate || 0 }]
    )
    setSelectedProduct("")
    setQuantity("1")
  }

  // Estimate only; the server prices the quote when it is saved.
  const quoteSubtotal = quoteItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const quoteTax = quoteItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity * i.taxRate) / 100, 0)
  const quoteTotal = quoteSubtotal + quoteTax

  const closeNew = () => { setShowNew(false); setQuoteItems([]); setCustomerId("") }

  const saveQuote = async () => {
    if (quoteItems.length === 0) return
    setBusy(true)
    try {
      await api("/quotes", { method: "POST", body: { ...(customerId ? { customerId } : {}), lines: quoteItems.map((i) => ({ productId: i.productId, quantity: i.quantity })) } })
      notify.success("Quote saved")
      closeNew()
      await load()
    } catch (e) {
      notify.error("Could not save the quote", errorMessage(e))
    }
    setBusy(false)
  }

  const convertToSale = async () => {
    if (!converting) return
    setBusy(true)
    try {
      // Re-priced by the server now; pay the whole total with the chosen method.
      const priced = await api<{ priced: { total: number } | null }>(`/quotes/${converting.id}`)
      const total = priced.priced?.total ?? Number(converting.total)
      const sale = toSale(await api(`/quotes/${converting.id}/convert`, {
        method: "POST", idempotencyKey: newIdempotencyKey(), body: { payments: [{ method, amount: total }] },
      }))
      useDataStore.getState().upsert("sales", sale, true)
      await refresh.products().catch(() => {})
      notify.success("Quote converted to a sale", sale.receiptNumber)
      router.push(`/sales/${sale.id}`)
    } catch (e) {
      notify.error("Could not convert the quote", errorMessage(e))
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!showDelete) return
    setBusy(true)
    try {
      await api(`/quotes/${showDelete}`, { method: "DELETE" })
      setQuotes((all) => all.filter((q) => q.id !== showDelete))
      setShowDelete(null)
    } catch (e) {
      notify.error("Could not discard the quote", errorMessage(e))
    }
    setBusy(false)
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
        <StatsCard title="Average Quote" value={quotes.length > 0 ? formatCurrency(totalQuoted / quotes.length) : formatCurrency(0)} icon={FileText} />
      </div>

      <Card><CardContent className="p-4">
        <SearchInput placeholder="Search by quote number..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table scroll>
          <TableHeader><TableRow><TableHead>Quote #</TableHead><TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Total</TableHead><TableHead>Valid until</TableHead><TableHead>Date</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-gray-500">Loading quotes…</TableCell></TableRow>
            ) : loadError ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-red-600">{loadError} <button className="underline" onClick={() => { setLoading(true); void load() }}>Try again</button></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="p-0">
                <EmptyState icon={<FileText className="h-12 w-12" />} title="No open quotes" description="Create a quote to share with a customer before they commit." action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" />New Quote</Button>} />
              </TableCell></TableRow>
            ) : filtered.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.number}</TableCell>
                <TableCell>{customers.find((c) => c.id === quote.customerId)?.name || "Walk-in"}</TableCell>
                <TableCell className="text-gray-500">{quote.lines.map((l) => `${l.quantity}× ${productName(l.productId)}`).slice(0, 2).join(", ")}{quote.lines.length > 2 ? ` +${quote.lines.length - 2}` : ""}</TableCell>
                <TableCell>{formatCurrency(Number(quote.total))}</TableCell>
                <TableCell className="text-gray-500">{quote.validUntil ? formatDateTime(quote.validUntil) : "-"}</TableCell>
                <TableCell className="text-gray-500">{formatDateTime(quote.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setConverting(quote); setMethod("cash") }} title="Convert to sale" aria-label={`Convert ${quote.number} to a sale`} className="rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowDelete(quote.id)} title="Discard quote" aria-label={`Discard ${quote.number}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={showNew} onClose={closeNew} title="New Quote" size="lg">
        <div className="space-y-4">
          <Select label="Customer (optional)" placeholder="Walk-in" options={customers.map((c) => ({ value: c.id, label: c.name }))} value={customerId} onChange={(e) => setCustomerId(e.target.value)} />

          <div className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">Add Items</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select label="Product" options={products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: `${p.name} (${formatCurrency(p.sellingPrice)})` }))} value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} />
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
                    <button aria-label={`Remove ${item.name}`} onClick={() => setQuoteItems((items) => items.filter((i) => i.productId !== item.productId))} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(quoteSubtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Tax (estimate)</span><span>{formatCurrency(quoteTax)}</span></div>
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(quoteTotal)}</span></div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeNew}>Cancel</Button>
            <Button disabled={quoteItems.length === 0} isLoading={busy} onClick={saveQuote}>Save Quote</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!converting} onClose={() => !busy && setConverting(null)} title={`Convert ${converting?.number ?? "quote"} to a sale`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">The items are priced again at today&apos;s prices and the stock is taken off. The customer pays the full total.</p>
          <Select label="Paid by" options={CONVERT_METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" disabled={busy} onClick={() => setConverting(null)}>Cancel</Button>
            <Button isLoading={busy} onClick={convertToSale}>Convert to sale</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!showDelete} onClose={() => setShowDelete(null)} title="Discard quote" size="sm">
        <p className="text-sm text-gray-600 mb-4">Discard this quote? It can&apos;t be turned into a sale afterwards.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(null)}>Cancel</Button>
          <Button variant="danger" isLoading={busy} onClick={confirmDelete}>Discard</Button>
        </div>
      </Dialog>
    </div>
  )
}
