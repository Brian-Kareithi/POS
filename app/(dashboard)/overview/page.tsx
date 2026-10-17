"use client"

import { useNow } from "@/lib/hooks/use-now"
import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts"
import { useDataStore } from "@/lib/stores/data-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useBranchFilter } from "@/lib/hooks/use-branch-filter"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { getStock, daysToExpiry, expiryStatus } from "@/lib/utils/stock"
import {
  change, dailySeries, expensesTotal, inRange, paymentBreakdown, periodRanges, productStats, salesIn, summarize, txIn,
  type Period,
} from "@/lib/utils/analytics"
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarClock, HandCoins, Receipt, ShoppingCart, TrendingUp, Wallet, Package,
} from "lucide-react"

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 days" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
]

const METHOD_COLOR: Record<string, string> = {
  cash: "var(--series-1)", card: "var(--series-2)", mobile_money: "var(--series-3)", bank_transfer: "var(--series-4)", credit: "var(--series-5)",
}
const METHOD_LABEL: Record<string, string> = {
  cash: "Cash", card: "Card", mobile_money: "M-Pesa", bank_transfer: "Bank transfer", credit: "On credit",
}

const kes = (n: number) => `KES ${Math.round(n).toLocaleString()}`
const compact = (n: number) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n)))

function Delta({ value, goodWhenUp = true, suffix }: { value: number | null; goodWhenUp?: boolean; suffix: string }) {
  if (value === null) return <span className="text-xs text-gray-400">No data {suffix}</span>
  const up = value >= 0
  const good = up === goodWhenUp
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${value === 0 ? "text-gray-500" : good ? "text-green-600" : "text-red-600"}`}>
      <Icon className="h-3.5 w-3.5" />{Math.abs(value).toFixed(1)}% <span className="font-normal text-gray-400">vs {suffix}</span>
    </span>
  )
}

function Kpi({ title, value, sub, icon: Icon, delta, goodWhenUp, suffix }: {
  title: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>
  delta: number | null; goodWhenUp?: boolean; suffix: string
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <div className="flex flex-wrap items-center gap-x-2"><Delta value={delta} goodWhenUp={goodWhenUp} suffix={suffix} />{sub && <span className="text-xs text-gray-500">{sub}</span>}</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3"><Icon className="h-6 w-6 text-gray-600" /></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-gray-900">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-gray-600"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name}: <span className="font-medium text-gray-900">{kes(p.value)}</span></p>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const now = useNow()
  const products = useDataStore((s) => s.products)
  const customers = useDataStore((s) => s.customers)
  const allSales = useDataStore((s) => s.sales)
  const allTransactions = useDataStore((s) => s.transactions)
  const branches = useDataStore((s) => s.branches)
  const user = useAuthStore((s) => s.user)
  const { sales, transactions, label: branchLabel, branchId } = useBranchFilter()
  const [period, setPeriod] = useState<Period>("today")

  const view = useMemo(() => {
    const { current, previous, label, previousLabel } = periodRanges(period)
    const curSales = salesIn(sales, current)
    const prevSales = salesIn(sales, previous)
    const cur = summarize(curSales, products)
    const prev = summarize(prevSales, products)
    const curExp = expensesTotal(txIn(transactions, current))
    const prevExp = expensesTotal(txIn(transactions, previous))
    const month = new Date()
    const series =
      period === "year"
        ? Array.from({ length: 12 }, (_, i) => {
            const start = new Date(month.getFullYear(), month.getMonth() - (11 - i), 1)
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
            return {
              label: start.toLocaleDateString("en-KE", { month: "short" }),
              sales: Math.round(summarize(salesIn(sales, { start, end }), products).net),
              expenses: Math.round(expensesTotal(txIn(transactions, { start, end }))),
            }
          })
        : dailySeries(sales, transactions, period === "month" ? Math.max(14, month.getDate()) : 14)
    return { current, label, previousLabel, curSales, cur, prev, curExp, prevExp, series }
  }, [period, sales, transactions, products])

  const { cur, prev, curExp, prevExp } = view
  const netProfit = cur.grossProfit - curExp
  const prevNetProfit = prev.grossProfit - prevExp
  const avgBasket = cur.transactions ? cur.net / cur.transactions : 0
  const prevAvg = prev.transactions ? prev.net / prev.transactions : 0
  const suffix = view.previousLabel

  const stats = useMemo(() => productStats(view.curSales, products), [view.curSales, products])
  const best = [...stats].filter((s) => s.quantity > 0).sort((a, b) => b.quantity - a.quantity).slice(0, 5)
  const monthStats = useMemo(() => productStats(salesIn(sales, periodRanges("month").current), products), [sales, products])
  const slow = [...monthStats].sort((a, b) => a.quantity - b.quantity).slice(0, 4)
  const payments = paymentBreakdown(view.curSales).map((p) => ({ ...p, label: METHOD_LABEL[p.method] ?? p.method }))
  const lowStock = products.filter((p) => p.isActive && getStock(p) <= p.minStock).sort((a, b) => getStock(a) - getStock(b))
  const expiring = products.filter((p) => ["soon", "expired"].includes(expiryStatus(p))).sort((a, b) => (daysToExpiry(a) ?? 0) - (daysToExpiry(b) ?? 0))
  const owing = customers.filter((c) => (c.amountOwed ?? 0) > 0).sort((a, b) => (a.creditDueDate ?? "").localeCompare(b.creditDueDate ?? ""))
  const totalOwed = owing.reduce((s, c) => s + (c.amountOwed ?? 0), 0)
  const maxBest = Math.max(1, ...best.map((b) => b.quantity))

  const branchRows = branches.map((b) => {
    const s = summarize(salesIn(allSales.filter((x) => x.branchId === b.id), view.current), products)
    const e = expensesTotal(txIn(allTransactions.filter((t) => t.branchId === b.id), view.current))
    return { id: b.id, name: b.name, net: s.net, profit: s.grossProfit - e, transactions: s.transactions }
  })

  const recent = [...sales].slice(0, 7)
  const cashIn = cur.collected
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting}, ${user?.name.split(" ")[0] ?? "there"}`} description={`${branchLabel} · ${view.label} compared with ${suffix}`}>
        <div className="flex rounded-lg bg-gray-100 p-1 text-sm" role="tablist" aria-label="Period">
          {PERIODS.map((p) => (
            <button key={p.id} role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)} className={`rounded-md px-3 py-1.5 font-medium ${period === p.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{p.label}</button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi title="Net sales" value={formatCurrency(cur.net)} icon={ShoppingCart} delta={change(cur.net, prev.net)} suffix={suffix} sub={`${formatCurrency(cur.discounts)} discounts`} />
        <Kpi title="Gross profit" value={formatCurrency(cur.grossProfit)} icon={TrendingUp} delta={change(cur.grossProfit, prev.grossProfit)} suffix={suffix} sub={`${cur.margin.toFixed(1)}% margin`} />
        <Kpi title="Expenses" value={formatCurrency(curExp)} icon={Wallet} delta={change(curExp, prevExp)} goodWhenUp={false} suffix={suffix} />
        <Kpi title="Net profit" value={formatCurrency(netProfit)} icon={HandCoins} delta={change(netProfit, prevNetProfit)} suffix={suffix} sub="after expenses" />
        <Kpi title="Transactions" value={cur.transactions.toLocaleString()} icon={Receipt} delta={change(cur.transactions, prev.transactions)} suffix={suffix} />
        <Kpi title="Average basket" value={formatCurrency(avgBasket)} icon={Package} delta={change(avgBasket, prevAvg)} suffix={suffix} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cash flow</h3>
              <p className="text-xs text-gray-500">Net sales in, expenses out · {period === "year" ? "by month" : "by day"}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-500">Collected <b className="text-gray-900">{formatCurrency(cashIn)}</b></span>
              <span className="text-gray-500">Spent <b className="text-gray-900">{formatCurrency(curExp)}</b></span>
              <span className="text-gray-500">Net <b className={cashIn - curExp >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(cashIn - curExp)}</b></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72" role="img" aria-label="Chart of net sales and expenses over time">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={view.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={{ fill: "var(--chart-text)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={compact} width={40} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--chart-grid)" }} />
                  <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ fontSize: 12, color: "var(--chart-text)" }} />
                  <Area type="monotone" dataKey="sales" name="Net sales" stroke="var(--series-1)" strokeWidth={2} fill="var(--series-1)" fillOpacity={0.12} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="var(--series-2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">How customers paid</h3><p className="text-xs text-gray-500">{view.label}</p></CardHeader>
          <CardContent>
            {payments.length === 0 ? <p className="py-10 text-center text-sm text-gray-500">No sales in this period yet.</p> : (
              <div className="h-60" role="img" aria-label="Payments by method">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payments} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={10}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" tick={{ fill: "var(--chart-text)", fontSize: 12 }} tickLine={false} axisLine={false} width={86} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--chart-grid)", opacity: 0.4 }} />
                    <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]} barSize={16} label={{ position: "right", fill: "var(--chart-text)", fontSize: 11, formatter: (v: unknown) => compact(Number(v)) }}>
                      {payments.map((p) => <Cell key={p.method} fill={METHOD_COLOR[p.method] ?? "var(--series-1)"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Best sellers</h3><p className="text-xs text-gray-500">By units sold · {view.label}</p></CardHeader>
          <CardContent className="space-y-3">
            {best.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No sales in this period yet.</p>}
            {best.map((b, i) => (
              <div key={b.product.id}>
                <div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium text-gray-900">{i + 1}. {b.product.name}</span><span className="text-gray-500">{b.quantity} sold · {formatCurrency(b.revenue)}</span></div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${(b.quantity / maxBest) * 100}%`, background: "var(--series-1)" }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Slow-moving products</h3><p className="text-xs text-gray-500">Fewest sales this month, with stock tied up</p></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Sold</TableHead><TableHead>In stock</TableHead><TableHead>Cash tied up</TableHead></TableRow></TableHeader>
              <TableBody>
                {slow.map((s) => (
                  <TableRow key={s.product.id}>
                    <TableCell className="font-medium">{s.product.name}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>{getStock(s.product)}</TableCell>
                    <TableCell>{formatCurrency(getStock(s.product) * s.product.costPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><AlertTriangle className="h-5 w-5 text-orange-500" />Low stock</h3><Link href="/insights" className="text-sm text-blue-600 hover:underline">Reorder</Link></CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 && <p className="py-4 text-center text-sm text-gray-500">Everything is well stocked.</p>}
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm"><span className="truncate pr-2 text-gray-900">{p.name}</span><Badge variant={getStock(p) === 0 ? "danger" : "warning"}>{getStock(p)} left</Badge></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><CalendarClock className="h-5 w-5 text-orange-500" />Nearing expiry</h3></CardHeader>
          <CardContent className="space-y-2">
            {expiring.length === 0 && <p className="py-4 text-center text-sm text-gray-500">Nothing expires in the next 30 days.</p>}
            {expiring.slice(0, 6).map((p) => {
              const d = daysToExpiry(p) ?? 0
              return <div key={p.id} className="flex items-center justify-between text-sm"><span className="truncate pr-2 text-gray-900">{p.name}</span><Badge variant={d < 0 ? "danger" : "warning"}>{d < 0 ? "Expired" : `${d} days`}</Badge></div>
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900">Outstanding payments</h3><span className="text-sm font-semibold text-gray-900">{formatCurrency(totalOwed)}</span></CardHeader>
          <CardContent className="space-y-2">
            {owing.length === 0 && <p className="py-4 text-center text-sm text-gray-500">Nobody owes the shop money.</p>}
            {owing.slice(0, 5).map((c) => {
              const overdue = c.creditDueDate && new Date(c.creditDueDate).getTime() < now
              return (
                <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center justify-between text-sm hover:bg-gray-50">
                  <span className="text-gray-900">{c.name}</span>
                  <span className="flex items-center gap-2">{formatCurrency(c.amountOwed ?? 0)}<Badge variant={overdue ? "danger" : "default"}>{overdue ? "Overdue" : c.creditDueDate ? `Due ${new Date(c.creditDueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}` : "Open"}</Badge></span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {branchId === "all" && branchRows.length > 1 && (
        <Card>
          <CardHeader><h3 className="text-lg font-semibold text-gray-900">Branch comparison</h3><p className="text-xs text-gray-500">{view.label}</p></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Branch</TableHead><TableHead>Net sales</TableHead><TableHead>Transactions</TableHead><TableHead>Profit after expenses</TableHead></TableRow></TableHeader>
              <TableBody>
                {branchRows.map((b) => (
                  <TableRow key={b.id}><TableCell className="font-medium">{b.name}</TableCell><TableCell>{formatCurrency(b.net)}</TableCell><TableCell>{b.transactions}</TableCell><TableCell className={b.profit < 0 ? "text-red-600" : ""}>{formatCurrency(b.profit)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between"><h3 className="text-lg font-semibold text-gray-900">Recent transactions</h3><Link href="/sales" className="text-sm text-blue-600 hover:underline">View all</Link></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Time</TableHead><TableHead>Total</TableHead><TableHead>Paid by</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {recent.map((s) => (
                <TableRow key={s.id}>
                  <TableCell><Link href={`/sales/${s.id}`} className="font-medium text-blue-600 hover:underline">{s.receiptNumber ?? s.orderNumber}</Link></TableCell>
                  <TableCell className="text-gray-500">{formatDateTime(s.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(s.total)}</TableCell>
                  <TableCell>{METHOD_LABEL[s.paymentMethod]}</TableCell>
                  <TableCell><Badge variant={s.status === "completed" ? "success" : s.status === "refunded" ? "danger" : "default"}>{s.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
