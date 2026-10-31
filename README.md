# This POS System

A cloud point-of-sale system for Kenyan businesses, built with Next.js 16. One app serves many kinds of business (shops, restaurants, salons, pharmacies, garages, couriers, schools and more): each business picks its industry when it signs up and gets the tabs, staff roles and wording that fit it. The owner can hide the tabs they don't need and upload their own logo, and the developer runs the whole platform from a separate **super admin** portal.

This is the web app. It talks to the **Kareithi POS API** in the sibling folder `../Kareithi-Pos`, which owns all data, prices, stock, roles and permissions. The browser only decides what to *show*; the server decides what is *allowed*.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. This Next.js has breaking changes from older versions: read the guides in `node_modules/next/dist/docs/` before changing framework-level code.
- **State:** Zustand (the session and a few preferences persist; business data is held in memory)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts, with a colour palette that has light and dark steps
- **Toasts:** Sonner, themed to the POS green
- **Animation:** `@lottiefiles/dotlottie-react` for the sign-in background
- **Icons:** Lucide
- **Tests:** Vitest + Testing Library

## Getting started

Start the API first (see `../Kareithi-Pos/README.md`), then:

```bash
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local   # default; change it for a deployed API
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / run it |
| `npm test` | Vitest: sign-in, join link, staff approval, industry picker, navigation, offline sync |
| `npm run lint` | ESLint |

### Who signs in

- **A business owner** creates a business at `/register` (they choose an industry and accept the terms). They then approve staff who ask to join through the link on the Staff page (`/join?business=<slug>`).
- **Staff** request access, wait as *pending*, and sign in once the owner approves them and gives them a role.
- **The super admin** (the platform developer) signs in on the same login screen. That account is created directly in the database (see "Super admin accounts" in the API's README); there is no sign-up for it. After sign-in they land in `/admin`.

## What the app does

### For every business
- **The till** (`/`): search or scan, hold and resume sales, discounts and promo codes, split payments (cash, M-Pesa, card, bank, credit), receipts you can print or share, keyboard shortcuts (`F2` search, `F4` charge, `F6` hold, `F8` customer, `F9` discount). A sale needs an open shift; if there isn't one you get a toast that says so.
- **Open tabs** (bars and restaurants, `/tabs`): press **New tab** (or **Tab** / `F7` on the till to put the current order on a table), keep adding rounds as people order, and settle when they are ready. Each tab has a **Guest QR**: scanning it opens `/t/<token>` on the guest's phone, a read-only bill that prints out like a receipt, updates live as items are added, and ends with the total at the bottom. The guest can pay it with M-Pesa, or the owner/cashier can settle it at the till; either way it becomes a normal sale and the page turns into a stamped receipt. Taking items off an older tab needs a manager's PIN.
- **Faster sales:** Enter in the search box adds the top match, **Exact cash, done** completes a sale in one tap, cash payments have one-tap amount buttons (Exact, next round figures) and Enter finishes a fully paid sale.
- **Partial refunds:** on a sale, tap Refund and choose which items, and how many units of each, are coming back. Only those units return to stock, only that share is refunded, and the sale shows what was kept. A sale can be refunded in several steps; once any part has been refunded it can no longer be voided. Anyone allowed to refund can do it, and a cashier still needs a manager's PIN.
- **Offline selling:** sales rung up without internet are saved on the device and uploaded, oldest first, when the connection returns. Each sale is reported as created, duplicate, rejected or retry; none is silently dropped.
- **Owners and hours:** owners never clock in, so they have no clock button and are left out of the Hours worked report (they can still see everyone else's hours). Selling still needs an open shift for everyone, owners included.
- **Dashboard** (`/overview`), **Insights**, **Reports**, **Accounting**, **Promotions**, **Customers**, **Products**, **Inventory** (stock by branch, purchase orders, transfers), **Staff**, **Shifts & Cash**, **Hours worked**, **Audit log**, **Settings**.
- **Shift shortcut:** anyone who works a till gets an "Open shift" / "Close shift" button in the top bar and on the dashboard, which opens the right dialog on Shifts & Cash.
- **Multi-branch:** the branch switcher filters the dashboard, sales and reports; staff only sell from their own branch's stock.
- **Dark mode**, a layout that works on phones, and all amounts in KES.

### Industry-specific
Each industry gets its own extra tabs and fixed staff roles, for example Deliveries and Fleet for couriers and distributors, Appointments for salons, Prescriptions for pharmacies, Work orders for garages, Students and Fee invoices for schools. There is no catch-all "Other" business: every industry has its own roles.

### Owner tools
- **Features & tabs** (`/settings/features`, owner only): every tab the business can use, what it does and how it helps growth, with a switch to hide the ones it doesn't need. Hidden tabs disappear for everyone in the business; data is kept.
- **Logo** (`/settings/business`, owner only): upload a PNG, JPEG or WebP up to 2 MB. It shows at the top of the sidebar and top bar for every employee.
- **Staff & permissions**, **Backups & data export**, **API keys**, **Integrations**.

### Super admin (`/admin`)
A separate portal with the same floating sidebar and top bar, and no business data. It never loads any business's records.
- **Overview:** businesses, people, sign-ups, who has been active, and a split by industry.
- **Businesses:** search by business, owner name or owner email; open one to see every account in it.
- **Per business:** suspend, close or reactivate (everyone is signed out and locked out); hide or show its tabs; **erase it permanently** (type `delete` to confirm).
- **Per person:** set a password or email a reset link, force sign-out, reset two-factor, revoke or restore access.
- **Activity:** what people did inside every business, and a log of the super admin's own actions.

## Under the hood

### Talking to the API (`lib/api/client.ts`)
One `api()` function adds the bearer token, parses errors into an `ApiError` and, on a `401`, rotates the refresh token and retries. Refreshes are serialised, because the server treats a replayed refresh token as theft. The auth store registers itself with the client through a small bridge so the two never import each other. Validation errors arrive from the server already worded as plain sentences ("Business name must be at least 2 characters") and are shown as they are. `lib/api/messages.ts` maps error codes (suspended business, expired session, offline, rate limit...) to the wording on sign-in and sign-up.

### Session and data (`lib/stores/`)
- `auth-store` holds the user and tokens (persisted). It validates the stored session once per visit, and a network failure is not treated as a bad token, so a till keeps working offline. The super admin has their own `/admin/me` and `/admin/logout`.
- `data-store` holds the business's products, stock, sales, staff and so on after `useInitializeData` loads them. `ui-store` holds the theme, branch filter, the mobile menu and whether the desktop sidebar is collapsed.
- A snapshot of the data and a queue of offline sales live in `lib/offline/`; `public/sw.js` is the service worker; `useOfflineSync` uploads when the connection returns.

### Navigation and roles (`lib/navigation.ts`, `lib/permissions.ts`)
Tabs are built from the industry config the server returns (`GET /industry`): its modules (minus any the owner hid), its wording and its record types, filtered by what the person's role may do. `landingFor` decides the first page after sign-in: the dashboard for anyone who can see it, otherwise the till, stock or deliveries. `routeAllowed` fails closed: an unknown route is not allowed. `lib/permissions.ts` mirrors the server's map only to decide what to show; the server enforces it.

### Layout
`components/layout/sidebar-frame.tsx` is the one floating sidebar used by both portals: solid rounded card, a logo and name on top, menu pills, then the signed-in person's chip above Logout. On wide screens it collapses to icons (remembered); on phones it is a drawer opened by the hamburger, closed by default, and it closes on every page change. Toasts drop in top-centre on phones and top-right elsewhere.

### Logos
- **Sign-in and sign-up always show the platform logo** (`PlatformLogo`). No business is known there, and a business's logo must never reach another business. The API never sends a business logo before sign-in.
- **After sign-in** the sidebar and top bar show the business's own logo, or the platform logo if it has none (`BusinessLogo`).
- To change the platform logo, replace `public/brand/logo.png` (a square PNG, at least 256x256). The path is `PLATFORM_LOGO` in `lib/constants/index.ts`.

### Sign-in screens
The liquid background is the "Liquid style abstract animated background" by Meenu Chan (LottieFiles, Lottie Simple License). Both colourings (soft green for light mode, deep green for dark mode) and the player's WebAssembly are served from `public/animations/`, so nothing loads from a third party. It stays still for people who ask their device for less motion. The industry picker is a closed field that opens a searchable list (a bottom sheet on phones) and understands everyday words such as "salon" or "pharmacy". `/terms` holds the terms and conditions, which are fictional placeholder text until real ones are written.

### Loading states
Pages show skeleton screens, not spinners or "Loading..." text. `components/ui/skeleton.tsx` has shapes drawn like the live design: the full shell (floating sidebar, top bar), the sign-in card, stat cards (2x2), lists, forms and detail pages. When a screen's design changes, update its skeleton too.

## Project structure

```
app/
├── (auth)/             Sign-in, sign-up, join link, password reset, with the liquid background
├── (dashboard)/        The business portal: shell plus every staff page
│   ├── page.tsx        The till, at "/"
│   ├── overview/       Dashboard
│   ├── settings/       Business (with logo), features, taxes, receipts, payments, backups...
│   └── ...             sales, products, inventory, customers, employees, deliveries, fleet, work, reports
├── (admin)/admin/      The super admin portal: overview, businesses, activity, my account
├── t/[token]/          Guest tab page (public, read-only bill with a pay button)
├── terms/              Terms and conditions
├── self-checkout/      Customer self-checkout flow
└── checkout/           QR payment page
components/
├── auth/               Industry picker, terms checkbox, liquid background, password input
├── brand/              PlatformLogo, BusinessLogo
├── layout/             SidebarFrame, sidebar, top bar, shift shortcut, clock widget, connection status
├── tabs/               Tab picker and guest QR dialogs
├── pos/                Till, payment, receipt, discount, customer, scanner and stock dialogs
└── ui/                 Buttons, inputs, tables, dialogs, skeletons, toaster
lib/
├── api/                client, per-area API helpers (admin, staff, deliveries, sync), error messages
├── stores/             Zustand stores (auth, data, POS session, UI)
├── offline/            Snapshot and offline sale queue
├── hooks/              Data loading, notifications stream, offline sync, online status
├── services/           Completing, refunding and syncing sales
├── navigation.ts       Role- and industry-aware navigation and route access
└── permissions.ts      Roles and the permission map (display only)
public/
├── brand/logo.png      The platform logo
├── animations/         Sign-in background (light and dark) and its player
└── sw.js               Service worker
tests/                  Vitest
```

## Deploying

Set `NEXT_PUBLIC_API_URL` to the API's public address, run `npm run build` and `npm start`. The API must allow this site's origin in its `CORS_ORIGINS`, and needs file storage configured for logo uploads.

## License

MIT
