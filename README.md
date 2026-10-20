# This POS System

A point-of-sale system for Kenyan retail shops, built with Next.js 16. It covers the till, stock, staff, money and reporting for one shop or several, and ships with fictional demo data (a two-branch shop called **Jamii Retail**) so every screen has something to show.

> **This is a front-end demo.** All data lives in the browser (`localStorage`), M-Pesa and eTIMS are simulated, and there is no server database yet. See [What is simulated](#what-is-simulated) for what a production version would add.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **State:** Zustand (persisted to the browser)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts, with a validated colour palette that has light and dark steps
- **Toasts:** Sonner, themed to the POS green
- **Icons:** Lucide

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo data loads on first run. To start over, clear the site's storage in your browser, or restore a backup from **Settings → Backups & data export**.

### Demo accounts

Any password works. The login page has one-click buttons for each role.

| Role | Email | What they see |
|---|---|---|
| Owner / Director | `owner@jamiiretail.co.ke` | Everything, including staff, settings and backups |
| Manager | `manager@jamiiretail.co.ke` | Runs the shop: approvals, prices, refunds, stock, reports |
| Cashier | `cashier1@jamiiretail.co.ke` | The till, small discounts, customers and their own shift |
| Stockkeeper | `stock@jamiiretail.co.ke` | Products, stock counts, purchase orders |

`cashier2@jamiiretail.co.ke` works at the Eastleigh branch. The **manager approval PIN** used for refunds, voids and large discounts is `1234`.

## Features

### The till (`/`)
- Search by name, SKU or barcode. USB and Bluetooth scanners work with no setup, and any device with a camera can scan from the browser (Chrome or Edge).
- Hold a sale and resume it later; remove or correct items; stock is checked per branch, and expired products can't be sold.
- Discounts, promo codes and loyalty points. Cashiers can give up to 5% on their own; more needs a manager's PIN.
- Payments: cash with automatic change, M-Pesa (simulated STK push with paid, cancelled and insufficient-funds outcomes), card, bank transfer and customer credit. Payments can be split across methods, and a balance can be put on a customer's account.
- A sale can never be recorded twice (idempotent submit), and failed payments record nothing.
- Receipts: print at 80 mm, send by SMS, email or WhatsApp (simulated), reprint without creating a new sale. Receipts carry a KRA eTIMS reference and QR code.
- Keyboard shortcuts: `F2` search, `F4` charge, `F6` hold, `F8` customer, `F9` discount.
- Customers are optional. A walk-in can buy without registering.
- Offline mode: click the cloud icon in the top bar to simulate losing internet. Sales are saved on the device, flagged as waiting to sync, and uploaded when you reconnect.

### Business owner tools
- **Dashboard** (`/overview`): sales, gross profit, expenses, net profit, transactions and basket size for today, 7 days, month or year, each compared with the previous period. Also cash flow, payment mix, best sellers, slow movers, low stock, items nearing expiry, outstanding customer payments and branch comparison.
- **Insights** (`/insights`): stock run-out forecasts, suggested reorders you can turn into purchase orders in one click, busiest days and hours, products bought together, and a 7-day sales forecast.
- **Reports** (`/reports`): sales, profit, inventory, customers, staff and VAT. Custom date ranges, branch filter, and export to CSV, Excel or PDF.
- **Accounting:** expenses by category, income, and profit that is worked out from cost of goods sold, not simply sales minus expenses.
- **Promotions:** percentage, fixed-amount and buy-one-get-one codes that can be scheduled and switched off.
- **Customers:** profiles, loyalty points, consent for SMS, credit accounts with limits, due dates and repayments.

### Stock and suppliers
- Products with barcodes, SKUs, costs, prices, tax rates, batch numbers and expiry dates; archive instead of delete.
- Stock is counted per branch. Update stock by adding, removing or setting a total, with a reason (damaged, expired, missing, returned, count correction).
- Purchase orders with line items, approval and **receive goods**, which updates stock.
- Transfers between branches with request, approve and delivered steps.
- Sales deduct stock automatically; refunds and voids return it.

### Staff, control and trust
- Roles: Owner, Manager, Cashier, Stockkeeper, with a visible permission matrix under **Staff**. Menus and URLs are restricted by role.
- **Audit log** (`/audit`): who changed a price, adjusted stock, gave a discount, voided a sale or issued a refund. Risky events also raise an alert.
- Refunds and voids need a reason, and manager approval when a cashier does them.
- **Shifts & cash:** opening float, expected cash, counted cash and variance, with a note required when the drawer doesn't balance.
- **Backups & data export:** download a full backup, restore from a file, or export any table to CSV.

### Multi-branch
- The top bar's branch switcher filters the dashboard, sales and reports. Each branch has its own stock, sales, expenses and staff.
- Staff are assigned to a branch and a cashier only sells from their own branch's stock.

### Also included
- **Self-checkout:** QR-based checkout flow for customers.
- **Dark mode**, a responsive layout with a mobile bottom navigation, and all amounts in KES.

## What is simulated

| Area | In this demo | In production |
|---|---|---|
| Data | Browser `localStorage` | Server database, one isolated tenant per business |
| M-Pesa | Simulated STK push in the payment dialog | Daraja API with callbacks |
| eTIMS | Reference and QR on receipts | Submit invoices to KRA |
| SMS / email / WhatsApp receipts | A confirmation toast | Real gateways |
| Authentication | Any password; roles enforced in the UI | Hashed passwords, sessions, server-side permission checks |
| Backups | Download / restore a JSON file | Scheduled, monitored, tested server backups |
| Offline | Simulated with a toggle | Service worker plus a sync queue with conflict handling |

Role checks in this demo only hide screens and block actions in the browser. A real deployment must enforce the same permissions on the server.

## Project structure

```
app/
├── (auth)/             Login, register, 2FA
├── (dashboard)/        App shell (sidebar and top bar) and every staff page
│   ├── page.tsx        The till, at "/"
│   ├── overview/       Business dashboard
│   ├── insights/       Reorders, forecasts, peak times
│   ├── sales/          History, returns and voids, quotes, receipts
│   ├── products/       Catalog, categories, brands, suppliers
│   ├── inventory/      Stock by branch, adjustments, purchase orders, transfers
│   ├── customers/      Profiles, loyalty, credit accounts
│   ├── employees/      Staff, permission matrix, shifts & cash
│   ├── accounting/     Expenses, income, profit
│   ├── reports/        Sales, profit, inventory, customers, staff, VAT
│   ├── promotions/     Promo codes and offers
│   ├── audit/          Audit log
│   └── settings/       Business, taxes, receipts, integrations, backups
├── self-checkout/      Customer self-checkout flow
└── checkout/           QR payment page
components/
├── pos/                Till, payment, receipt, discount, customer, scanner and stock dialogs
├── reports/            Date range and export toolbar
├── layout/             Sidebar, top bar, branch switcher, connection status
└── ui/                 Buttons, inputs, tables, dialogs, toaster
lib/
├── services/           checkout.ts: completing, refunding and syncing sales
├── stores/             Zustand stores (data, auth, POS session, UI)
├── utils/              analytics, pricing, stock, barcode, export
├── constants/          Fictional demo data (mock-data.ts, mock-seed.ts)
├── permissions.ts      Roles and the permission matrix
└── navigation.ts       Role-aware navigation and route access
```

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm start       # run the production build
npm run lint    # ESLint
```

## License

MIT


## Backend connection

The app talks to the Kareithi POS API (see `../Kareithi-Pos`). Set the address in `.env.local` (default `http://localhost:4000`):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- Owners create a business at `/register-business`. Staff join with the link on the Staff page (`/join?business=<slug>`), wait as *pending*, and can sign in once the owner approves them.
- All data (products, stock, sales, customers, staff, settings) is loaded from the API after sign-in and held in memory only.
- `npm test` runs the sign-in, join-link and staff-approval tests.
