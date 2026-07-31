import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageBreak } from "docx"
import * as fs from "fs"

const APP_NAME = "This POS System"

const colors = {
  primary: "2563eb",
  dark: "111827",
  gray: "6b7280",
  lightBg: "f9fafb",
}

function heading(level, text, spacing = 400) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: level === 1 ? 36 : level === 2 ? 28 : 24, color: colors.dark })],
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: spacing, after: 200 },
  })
}

function para(text, options = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, color: colors.dark, ...options })],
    spacing: { after: 120 },
    ...(options.alignment ? { alignment: options.alignment } : {}),
  })
}

function boldPara(boldText, normalText) {
  return new Paragraph({
    children: [
      new TextRun({ text: boldText, bold: true, size: 21, color: colors.dark }),
      new TextRun({ text: normalText, size: 21, color: colors.dark }),
    ],
    spacing: { after: 120 },
  })
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, color: colors.dark })],
    bullet: { level },
    spacing: { after: 80 },
  })
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 100 } })
}

function divider() {
  return new Paragraph({
    children: [],
    spacing: { before: 200, after: 200 },
    thematicBreak: true,
  })
}

function tableRow(cells, header = false) {
  return new TableRow({
    children: cells.map(
      (cell) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, bold: header, size: 20, color: header ? "ffffff" : colors.dark })],
              spacing: { before: 40, after: 40 },
            }),
          ],
          width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
          shading: header ? { fill: colors.primary } : undefined,
        })
    ),
  })
}

function simpleTable(headers, rows) {
  return new Table({
    rows: [tableRow(headers, true), ...rows.map((r) => tableRow(r))],
    width: { size: 100, type: WidthType.PERCENTAGE },
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 21 },
      },
    },
  },
  sections: [
    {
      children: [
        // ============ TITLE PAGE ============
        new Paragraph({ children: [], spacing: { before: 3000 } }),
        new Paragraph({
          children: [new TextRun({ text: APP_NAME, bold: true, size: 52, color: colors.primary })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "Complete System Documentation", size: 32, color: colors.gray })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Cloud-Based Point of Sale System", size: 24, color: colors.gray })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Version 1.0.0  |  ${new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}`, size: 21, color: colors.gray })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "Built with Next.js 16, TypeScript, Tailwind CSS, Zustand, TanStack Query", size: 20, color: colors.gray })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),

        // ============ TABLE OF CONTENTS ============
        new Paragraph({ children: [], spacing: { before: 1500 } }),
        heading(1, "Table of Contents"),
        divider(),
        ...[
          "1. Project Overview",
          "2. Architecture & Tech Stack",
          "3. Authentication Module",
          "4. Dashboard Module",
          "5. Products Module",
          "6. Inventory Module",
          "7. Sales Module",
          "8. QR Checkout Flow",
          "9. Customers Module",
          "10. Employees Module",
          "11. Accounting Module",
          "12. Reports Module",
          "13. Settings Module",
          "14. Notifications Module",
          "15. Self-Checkout Module",
          "16. API Routes",
          "17. State Management",
          "18. Component Library",
          "19. Role-Based Access Control",
          "20. Dark Mode",
        ].map((item) => bullet(item)),

        // ============ 1. PROJECT OVERVIEW ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "1. Project Overview"),
        divider(),
        para(`${APP_NAME} is a complete, production-ready, cloud-based Point of Sale system designed for Kenyan retail businesses. It supports two user roles — Owner/Director and Sales Person — each with tailored interfaces and permissions.`),
        para("The system features real-time sales processing, inventory management, customer management, employee tracking, accounting, reporting, and a unique QR-based checkout flow where buyers scan a code to review items and pay via their preferred method."),
        emptyLine(),
        heading(2, "Key Features", 300),
        bullet("Multi-tenant architecture (supports multiple businesses, branches, warehouses)"),
        bullet("Role-based access control (Owner/Director and Sales Person)"),
        bullet("Fast POS checkout with barcode search, coupons, and split payments"),
        bullet("QR code checkout — sales person generates a code, buyer scans and pays"),
        bullet("Dark mode with pure black backgrounds"),
        bullet("Fully responsive — desktop sidebar, mobile bottom navigation"),
        bullet("Real-time notifications and dashboard analytics"),
        bullet("All currency displayed in Kenyan Shillings (KES)"),
        emptyLine(),

        heading(2, "Demo Credentials", 300),
        simpleTable(
          ["Role", "Email", "Password"],
          [
            ["Owner / Director", "owner@mainstreetretail.com", "password"],
            ["Sales Person", "sales1@mainstreetretail.com", "password"],
            ["Sales Person", "sales2@mainstreetretail.com", "password"],
          ]
        ),
        emptyLine(),

        // ============ 2. ARCHITECTURE ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "2. Architecture & Tech Stack"),
        divider(),

        heading(2, "Technology Stack", 300),
        simpleTable(
          ["Layer", "Technology", "Purpose"],
          [
            ["Framework", "Next.js 16 (App Router)", "Routing, SSR, API routes"],
            ["Language", "TypeScript", "Type safety across the codebase"],
            ["Styling", "Tailwind CSS v4", "Utility-first CSS framework"],
            ["State Management", "Zustand", "Client-side state with persist middleware"],
            ["Data Fetching", "TanStack Query", "Server data caching and sync"],
            ["Forms", "React Hook Form + Zod", "Form validation and management"],
            ["Icons", "Lucide React", "Icon component library"],
            ["Document Generation", "docx", "Word document generation"],
          ]
        ),
        emptyLine(),

        heading(2, "Project Structure", 300),
        para("The application follows a feature-based organization within the App Router convention:"),
        emptyLine(),
        para("app/ — Application routes organized by feature groups:"),
        bullet("(auth)/ — Authentication pages (login, register, forgot-password, verify-email, 2FA)"),
        bullet("(dashboard)/ — Main application shell with all business modules"),
        bullet("checkout/[session]/ — Buyer-facing QR checkout and payment page"),
        bullet("self-checkout/ — Mobile self-checkout flow (scan, cart, payment, receipt)"),
        bullet("api/ — REST API route handlers"),
        emptyLine(),
        para("components/ — Reusable UI and layout components:"),
        bullet("ui/ — Primitive components (Button, Input, Card, Table, Dialog, etc.)"),
        bullet("layout/ — Application shell (Sidebar, Navbar, Breadcrumbs, BottomNav, MobileNav)"),
        emptyLine(),
        para("lib/ — Business logic and utilities:"),
        bullet("stores/ — Zustand state stores (auth, cart, checkout, data, notification, UI)"),
        bullet("types/ — TypeScript type definitions for all entities"),
        bullet("constants/ — App constants and seed/mock data"),
        bullet("utils/ — Utility functions (formatting, ID generation, class merging)"),
        bullet("hooks/ — Custom React hooks"),
        emptyLine(),

        // ============ 3. AUTHENTICATION ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "3. Authentication Module"),
        divider(),
        para("The authentication module handles user access and session management. It provides a complete auth flow with persistent sessions via Zustand's persist middleware (localStorage)."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Login (/login)", 200),
        para("The login page provides two sign-in methods:"),
        bullet("Form-based login — Email and password fields with validation via Zod"),
        bullet("Quick sign-in buttons — One-click access as Owner/Director or Sales Person for demo purposes"),
        para("On successful authentication, the user is redirected to their role-appropriate dashboard (/) or sales page."),

        heading(3, "Register (/register)", 200),
        para("Registration form with name, email, password, and password confirmation. On success, displays a confirmation screen prompting email verification."),

        heading(3, "Forgot Password (/forgot-password)", 200),
        para("Email input to request a password reset link. On submission, displays a confirmation screen."),

        heading(3, "Email Verification (/verify-email)", 200),
        para("Prompt screen asking users to check their inbox for a verification link, with a resend button."),

        heading(3, "Two-Factor Authentication (/two-factor)", 200),
        para("A 6-digit code input interface for authenticator app TOTP codes. Auto-focuses next input on entry."),
        emptyLine(),

        heading(2, "Auth Store (auth-store.ts)", 300),
        para("The Zustand auth store manages:"),
        bullet("User object, JWT token, and refresh token"),
        bullet("Persistent authentication state across page refreshes"),
        bullet("Login method that simulates API authentication with demo users"),
        bullet("Logout that clears all auth state"),
        emptyLine(),

        // ============ 4. DASHBOARD ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "4. Dashboard Module"),
        divider(),
        para("The Dashboard is the Owner/Director's default landing page, providing a real-time overview of business performance. Sales Person users are redirected to the Sales page instead."),
        emptyLine(),

        heading(2, "Dashboard Shell (layout.tsx + dashboard-shell.tsx)", 300),
        para("The dashboard shell wraps all authenticated pages and provides:"),
        bullet("Auth guard — redirects unauthenticated users to /login"),
        bullet("Hydration-aware loading — waits for Zustand persist rehydration before rendering"),
        bullet("Skeleton loading screen — full-page skeleton layout (sidebar + navbar + content)"),
        bullet("Sidebar — role-filtered navigation (Owner sees all, Sales Person sees Products & Sales)"),
        bullet("Navbar — search, theme toggle, notifications bell, user profile dropdown"),
        bullet("Breadcrumbs — auto-generated from the current URL path"),
        bullet("BottomNav — mobile bottom tab bar"),
        bullet("MobileNav — FAB-triggered bottom sheet menu"),
        emptyLine(),

        heading(2, "Dashboard Page (/)", 300),
        para("The dashboard displays key performance metrics in a clean card layout:"),
        emptyLine(),

        heading(3, "Stats Cards", 200),
        simpleTable(
          ["Metric", "Source", "Description"],
          [
            ["Sales Today", "Sales store", "Count and revenue of today's sales"],
            ["This Week", "Sales store", "Count and revenue of the last 7 days"],
            ["Total Revenue", "Sales store", "All-time sales revenue"],
            ["Inventory Value", "Products store", "Total cost value of all inventory"],
          ]
        ),
        emptyLine(),

        heading(3, "Tables", 200),
        para("Recent Sales — Last 5 transactions with order number, amount, status badge, and date."),
        para("Best Selling Products — Top products sorted by name with SKU, price, and stock status."),
        emptyLine(),

        // ============ 5. PRODUCTS ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "5. Products Module"),
        divider(),
        para("The Products module provides complete product lifecycle management. Available to both Owner/Director and Sales Person roles (Sales Person is view-only)."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Products List (/products)", 200),
        para("Displays all products in a searchable, filterable table:"),
        bullet("Search by name or SKU"),
        bullet("Filter by category"),
        bullet("Actions dropdown per product (Edit, Delete)"),
        bullet("Delete confirmation dialog"),
        bullet("Quick links to Categories, Brands, and Suppliers"),
        bullet("Add Product button linking to /products/new"),
        emptyLine(),

        heading(3, "New Product (/products/new)", 200),
        para("A validated form to create a new product:"),
        simpleTable(
          ["Field", "Type", "Description"],
          [
            ["Product Name", "Text", "Required"],
            ["Category", "Select", "From existing categories"],
            ["Brand", "Select", "Optional"],
            ["Supplier", "Select", "Optional"],
            ["Description", "Textarea", "Optional"],
            ["Cost Price", "Number", "In KES"],
            ["Selling Price", "Number", "In KES"],
            ["Tax Rate", "Select", "0%, 5%, 8%, 10%, 16%, 20%"],
            ["Unit", "Select", "Piece, kg, g, l, ml, box, pack, carton"],
            ["Min Stock", "Number", "Low stock threshold"],
            ["Max Stock", "Number", "Maximum stock level"],
          ]
        ),
        para("On submit, SKU and barcode are auto-generated, and the product is added to the store."),
        emptyLine(),

        heading(3, "Product Edit (/products/[id])", 200),
        para("Full edit form pre-populated with existing product data. Tabs for Details and History."),
        emptyLine(),

        heading(3, "Categories (/products/categories)", 200),
        para("List of all categories with add dialog. Fields: Name, Description."),

        heading(3, "Brands (/products/brands)", 200),
        para("List of all brands with add dialog. Fields: Name, Description."),

        heading(3, "Suppliers (/products/suppliers)", 200),
        para("List of all suppliers with add dialog. Fields: Company Name, Contact Person, Email, Phone, Address."),
        emptyLine(),

        // ============ 6. INVENTORY ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "6. Inventory Module"),
        divider(),
        para("The Inventory module is available only to the Owner/Director role. It provides stock management across warehouses and branches."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Inventory Overview (/inventory)", 200),
        para("Dashboard-style view with:"),
        bullet("Stats cards: Total Items, Inventory Value, Low Stock Items"),
        bullet("Searchable product table with warehouse, stock level, value, and status"),
        bullet("Quick links to Warehouses, Transfers, Purchase Orders, and Adjustments"),
        emptyLine(),

        heading(3, "Warehouses (/inventory/warehouses)", 200),
        para("Manage storage locations. Add dialog with Name and Address fields."),

        heading(3, "Stock Transfers (/inventory/transfers)", 200),
        para("Transfer stock between warehouses. Create dialog with Product, Source Warehouse, Destination Warehouse, Quantity, and Notes."),

        heading(3, "Purchase Orders (/inventory/purchase-orders)", 200),
        para("Create and track orders to suppliers. Create dialog with Supplier, Warehouse, and Notes fields."),

        heading(3, "Stock Adjustments (/inventory/adjustments)", 200),
        para("Record stock changes for damaged goods, cycle counts, etc."),
        emptyLine(),

        // ============ 7. SALES ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "7. Sales Module"),
        divider(),
        para("The Sales module is the core POS functionality, available to both roles. Sales Person users have this as their primary interface."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Sales List (/sales)", 200),
        para("Transaction history with:"),
        bullet("Stats: Total Revenue, Completed Sales, Average Sale"),
        bullet("Searchable table with Order #, Customer, Items, Total, Payment Method, Status, Date"),
        bullet("Links to New Sale, Returns, and Quotes"),
        emptyLine(),

        heading(3, "New Sale / POS Checkout (/sales/new)", 200),
        para("The point-of-sale interface with three sections:"),
        emptyLine(),
        para("Cart Panel (left):"),
        bullet("Search and add products via dialog"),
        bullet("Customer selection (walk-in or registered)"),
        bullet("Quantity adjustment (+/- buttons)"),
        bullet("Per-item discount input"),
        bullet("Item total calculation"),
        bullet("Remove items"),
        emptyLine(),
        para("Summary Panel (right):"),
        bullet("Subtotal, Tax, Discount breakdown"),
        bullet("Payment method selector (Cash, Card, Bank Transfer, Mobile Money)"),
        bullet("Amount paid input with change calculation"),
        bullet("Notes field"),
        bullet("Coupon code application"),
        bullet("Complete Sale button"),
        emptyLine(),

        heading(3, "Sale Detail (/sales/[id])", 200),
        para("Order receipt view with:"),
        bullet("Status badge, total, and payment method cards"),
        bullet("Line items table"),
        bullet("Financial summary (subtotal, tax, discount, total, paid, change)"),
        bullet("Print and Download buttons"),
        emptyLine(),

        heading(3, "Returns (/sales/returns)", 200),
        para("Order search interface to process customer returns and refunds."),

        heading(3, "Quotes (/sales/quotes)", 200),
        para("Manage customer quotes and proforma invoices."),
        emptyLine(),

        // ============ 8. QR CHECKOUT ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "8. QR Checkout Flow"),
        divider(),
        para("The QR checkout feature bridges the gap between in-store POS and self-service payment. It allows a Sales Person to prepare a cart and the buyer to complete payment independently."),
        emptyLine(),

        heading(2, "Flow", 300),
        para("1. Sales Person adds items to the cart in /sales/new"),
        para("2. Sales Person clicks Generate QR Code"),
        para("3. A QR code is displayed on the POS screen containing a unique session token"),
        para("4. Buyer scans the QR code with their phone camera"),
        para("5. Buyer is taken to /checkout/[session] on their device"),
        para("6. Buyer reviews the item list and total"),
        para("7. Buyer selects a payment method (defaults to Mobile Money)"),
        para("8. Buyer clicks Pay — payment is processed"),
        para("9. Sale is recorded in the system"),
        para("10. Both the cashier and buyer see confirmation screens"),
        para("11. Session auto-expires after 30 minutes of inactivity"),
        emptyLine(),

        heading(2, "Technical Components", 300),

        heading(3, "QR Code Component (components/ui/qr-code.tsx)", 200),
        para("An inline SVG QR code generator that does not require any external dependencies. It generates a 25x25 matrix with:"),
        bullet("Three finder patterns (corners) for scanner recognition"),
        bullet("Data modules generated from a seeded hash of the input text"),
        bullet("Configurable size and className props"),
        emptyLine(),

        heading(3, "Checkout Store (lib/stores/checkout-store.ts)", 200),
        para("Zustand store managing checkout sessions:"),
        bullet("createSession — creates a new session with items, total, and 30-minute expiry"),
        bullet("getSession — retrieves a session by token"),
        bullet("completeSession — marks a session as completed"),
        bullet("expireSession — marks a session as expired"),
        bullet("cleanupExpired — removes expired sessions"),
        emptyLine(),

        heading(3, "Buyer Checkout Page (/checkout/[session])", 200),
        para("The buyer-facing payment page handles:"),
        bullet("Session validation — checks if session exists, is expired, or already completed"),
        bullet("Item preview — shows all items in the cart with quantities and prices"),
        bullet("Payment method selection — defaults to Mobile Money for scan-pay convenience"),
        bullet("Payment processing — simulates payment with 90% success rate"),
        bullet("Receipt confirmation — displays success screen after payment"),
        bullet("Notifications — sends real-time alert to the POS when payment is received"),
        emptyLine(),

        // ============ 9. CUSTOMERS ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "9. Customers Module"),
        divider(),
        para("The Customers module (Owner/Director only) manages customer profiles, loyalty, and purchase history."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Customers List (/customers)", 200),
        para("Searchable table with customer name, email, phone, loyalty points, and store credit."),
        bullet("Add Customer dialog with name, email, phone, address, group, and notes"),
        bullet("Stats cards: Total Customers, Total Points, Total Store Credit"),
        bullet("Link to Customer Groups management"),
        emptyLine(),

        heading(3, "Customer Detail (/customers/[id])", 200),
        para("Profile view with:"),
        bullet("Contact information (email, phone, address, birthday)"),
        bullet("Group, loyalty points, and store credit"),
        bullet("Purchase history timeline with order numbers, amounts, and statuses"),
        emptyLine(),

        heading(3, "Customer Groups (/customers/groups)", 200),
        para("Manage customer segments with different discount percentages. Add dialog with Name and Discount %."),
        emptyLine(),

        // ============ 10. EMPLOYEES ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "10. Employees Module"),
        divider(),
        para("The Employees module (Owner/Director only) manages staff accounts, roles, and shift tracking."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Employees List (/employees)", 200),
        para("Table with employee name, email, role, branch, salary, and status."),
        bullet("Stats: Total Employees, Active Staff, Monthly Payroll"),
        emptyLine(),

        heading(3, "Shift Management (/employees/shifts)", 200),
        para("Clock in/out tracking table. Shows employee, date, clock in/out times, and status."),
        emptyLine(),

        // ============ 11. ACCOUNTING ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "11. Accounting Module"),
        divider(),
        para("The Accounting module (Owner/Director only) tracks financial transactions and provides P&L summaries."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Accounting Overview (/accounting)", 200),
        para("Transaction management with:"),
        bullet("Stats: Sales Revenue, Total Income, Total Expenses"),
        bullet("Tabs for All / Income / Expenses"),
        bullet("Transaction table with description, category, type badge, amount, and date"),
        bullet("Add Transaction dialog with type (income/expense), category, amount, description, and reference"),
        emptyLine(),

        heading(3, "Accounting Reports (/accounting/reports)", 200),
        para("Three financial summary cards:"),
        bullet("Profit & Loss — Sales Revenue, Other Income, Total Expenses, Net Profit"),
        bullet("Key Metrics — Profit Margin, Revenue per Sale, Expense Ratio"),
        bullet("Tax Summary — Total Tax Collected"),
        emptyLine(),

        // ============ 12. REPORTS ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "12. Reports Module"),
        divider(),
        para("The Reports module (Owner/Director only) provides analytical views of business data."),
        emptyLine(),

        heading(2, "Report Hub (/reports)", 200),
        para("Navigation grid with six report types:"),
        bullet("Sales Reports — Total sales, revenue, average sale, recent transactions"),
        bullet("Inventory Reports — Stock levels, inventory value, low stock alerts"),
        bullet("Staff Reports — Employee roster with roles and status"),
        bullet("Customer Reports — Customer list with loyalty points and store credit"),
        bullet("Tax Reports — Tax collection breakdown by rate"),
        bullet("Profit Reports — Gross profit, net profit, profit margin breakdown"),
        para("Each report page includes an Export button for CSV/PDF generation."),
        emptyLine(),

        // ============ 13. SETTINGS ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "13. Settings Module"),
        divider(),
        para("The Settings module (Owner/Director only) configures system-wide parameters."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Settings Hub (/settings)", 200),
        para("Navigation grid with seven settings categories:"),

        simpleTable(
          ["Category", "Route", "Function"],
          [
            ["Business Settings", "/settings/business", "Company name, email, phone, address, currency, timezone"],
            ["Tax Settings", "/settings/taxes", "Tax rate management (Standard VAT 16%, Sales Tax 8%, Zero Rated 0%)"],
            ["Receipt Settings", "/settings/receipts", "Receipt header, footer, and terms & conditions customization"],
            ["Payment Settings", "/settings/payments", "Enable/disable payment methods (Cash, Card, Bank Transfer, Mobile Money)"],
            ["User Management", "/settings/users", "User list with roles, verification status, and 2FA status"],
            ["Backup Settings", "/settings/backups", "Backup schedule and manual backup trigger"],
            ["API Keys", "/settings/api-keys", "Generate and manage API integration keys"],
          ]
        ),
        emptyLine(),

        // ============ 14. NOTIFICATIONS ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "14. Notifications Module"),
        divider(),

        heading(2, "Notifications Page (/notifications)", 300),
        para("Central notification inbox showing all system alerts:"),
        bullet("Unread count badge on the navbar bell icon"),
        bullet("Notification list with title, message, type badge (success, warning, error, info), and timestamp"),
        bullet("Unread notifications highlighted with blue background"),
        bullet("Mark as read button per notification"),
        bullet("Mark All Read button to clear all unread"),
        bullet("Notifications are generated automatically on key events (new sales, payments received, low stock, etc.)"),
        emptyLine(),

        // ============ 15. SELF-CHECKOUT ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "15. Self-Checkout Module"),
        divider(),
        para("An alternative checkout flow where customers use a dedicated mobile web interface without cashier assistance."),
        emptyLine(),

        heading(2, "Pages", 300),

        heading(3, "Entry (/self-checkout)", 200),
        para("QR code display with session ID. Links to Scan Items and View Cart."),
        bullet("Large QR code for customer to scan"),
        bullet("Session ID for tracking"),
        emptyLine(),

        heading(3, "Scan Items (/self-checkout/scan)", 200),
        para("Barcode scanning interface with:"),
        bullet("Manual barcode input field"),
        bullet("Product search"),
        bullet("Product list with add-to-cart buttons"),
        emptyLine(),

        heading(3, "Cart (/self-checkout/cart)", 200),
        para("Cart review with quantity adjustment (+/-), item removal, and total."),
        emptyLine(),

        heading(3, "Payment (/self-checkout/payment)", 200),
        para("Payment method selection and processing. Shows order summary and payment confirmation."),
        emptyLine(),

        heading(3, "Receipt (/self-checkout/receipt)", 200),
        para("Digital receipt with order number, date, amount, payment method, and print/download options."),
        emptyLine(),

        // ============ 16. API ROUTES ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "16. API Routes"),
        divider(),
        para("The application provides REST API endpoints for authentication:"),
        emptyLine(),

        simpleTable(
          ["Route", "Method", "Description"],
          [
            ["/api/auth/login", "POST", "Authenticate user with email and password"],
            ["/api/auth/register", "POST", "Register a new user account"],
          ]
        ),
        emptyLine(),
        para("Additional API routes can be added for products, inventory, sales, customers, reports, payments, notifications, checkout, and webhooks by adding files under app/api/."),
        emptyLine(),

        // ============ 17. STATE MANAGEMENT ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "17. State Management"),
        divider(),
        para("The application uses Zustand for all client-side state management, with TanStack Query available for server data synchronization."),
        emptyLine(),

        heading(2, "Stores", 300),
        simpleTable(
          ["Store", "Persisted", "Purpose"],
          [
            ["auth-store", "Yes", "User authentication, tokens, session"],
            ["ui-store", "Yes (theme)", "Sidebar state, theme preference"],
            ["cart-store", "Yes", "POS cart items, customer, payment method"],
            ["checkout-store", "No", "QR checkout session lifecycle"],
            ["data-store", "No", "All business data (products, customers, sales, etc.)"],
            ["notification-store", "No", "Unread notification count"],
          ]
        ),
        emptyLine(),

        // ============ 18. COMPONENT LIBRARY ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "18. Component Library"),
        divider(),
        para("All UI components follow a flat design system with:"),
        bullet("White backgrounds, light gray borders, black/dark gray typography"),
        bullet("Blue for primary actions, green for success, red for errors, orange for warnings"),
        bullet("8px-12px rounded corners, consistent spacing, excellent typography hierarchy"),
        bullet("No gradients, no glassmorphism, no neumorphism"),
        bullet("Fully responsive with keyboard shortcut support"),
        emptyLine(),

        heading(2, "UI Components (components/ui/)", 300),
        para("Button — Multi-variant (primary, secondary, danger, ghost, success, warning) and multi-size (sm, md, lg) with loading state"),
        para("Input — Text input with label, error state, and optional icon"),
        para("Select — Dropdown with label, error state, and placeholder"),
        para("Textarea — Multi-line text input with label and error state"),
        para("Card, CardHeader, CardContent, CardFooter — Composable card layout"),
        para("Badge — Status indicator with variant colors (default, success, warning, danger, info)"),
        para("Table, TableHeader, TableBody, TableRow, TableHead, TableCell — Structured data tables"),
        para("Dialog — Modal overlay with title, close button, and size variants (sm, md, lg, xl)"),
        para("EmptyState — Centered placeholder for empty data views"),
        para("Loading — Spinner with optional text and size variants"),
        para("PageHeader — Page title with description and action buttons"),
        para("StatsCard — KPI card with title, value, change indicator, and icon"),
        para("SearchInput — Search field with magnifying glass icon"),
        para("Tabs — Horizontal tab navigation with active state and optional count badges"),
        para("Skeleton — Loading placeholder with card and table variants"),
        para("QRCode — Inline SVG QR code generator (no external dependencies)"),
        emptyLine(),

        heading(2, "Layout Components (components/layout/)", 300),
        para("Sidebar — Left navigation panel with role-filtered items, responsive overlay on mobile"),
        para("Navbar — Top bar with search, theme toggle, notifications, user profile dropdown"),
        para("Breadcrumbs — Auto-generated path-based breadcrumb navigation"),
        para("BottomNav — Mobile bottom tab bar (visible on screens below lg breakpoint)"),
        para("MobileNav — FAB-triggered bottom sheet with full navigation"),
        emptyLine(),

        // ============ 19. ROLE-BASED ACCESS ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "19. Role-Based Access Control"),
        divider(),
        para("The system supports two distinct roles with tailored interfaces:"),
        emptyLine(),

        heading(2, "Owner / Director", 300),
        para("Full access to all system features for comprehensive business management:"),
        bullet("Dashboard — Real-time business performance analytics"),
        bullet("Products — Full CRUD for inventory items"),
        bullet("Inventory — Warehouse management, transfers, purchase orders"),
        bullet("Sales — POS checkout and transaction history"),
        bullet("Customers — Profiles, loyalty, purchase history"),
        bullet("Employees — Staff management and shift tracking"),
        bullet("Accounting — Financial transactions and P&L reports"),
        bullet("Reports — Six report types with data analysis"),
        bullet("Settings — Full system configuration"),
        bullet("Notifications — All system alerts"),
        emptyLine(),

        heading(2, "Sales Person", 300),
        para("Focused interface optimized for selling:"),
        bullet("Products — View product catalog (read-only)"),
        bullet("Sales — Full POS checkout with QR code generation"),
        para("Sales Person users are redirected away from owner-only pages and see a simplified navigation with just Products and Sales."),
        emptyLine(),

        // ============ 20. DARK MODE ============
        new Paragraph({ children: [new PageBreak()] }),
        heading(1, "20. Dark Mode"),
        divider(),
        para("The application includes a complete dark mode with pure black (#000000) backgrounds for OLED-friendly viewing."),
        emptyLine(),

        heading(2, "Implementation", 300),
        bullet("Theme state managed in ui-store with localStorage persistence"),
        bullet("Toggle button in the navbar (moon/sun icon)"),
        bullet("CSS custom properties overridden when .dark class is applied to HTML element"),
        bullet("Dark mode uses pure black backgrounds (#000) with carefully tuned gray scale"),
        bullet("All blue, green, red, and orange accent colors adjusted for dark background contrast"),
        bullet("System preference detected via prefers-color-scheme media query"),
        emptyLine(),

        heading(2, "Dark Mode Colors", 300),
        simpleTable(
          ["Token", "Light", "Dark"],
          [
            ["Background", "#ffffff", "#000000"],
            ["Card Background", "#ffffff", "#111111"],
            ["Sidebar Background", "#ffffff", "#111111"],
            ["Border Light", "#e5e7eb", "#222222"],
            ["Border Lighter", "#f3f4f6", "#1a1a1a"],
            ["Text Primary", "#111827", "#eeeeee"],
            ["Text Secondary", "#4b5563", "#aaaaaa"],
            ["Text Muted", "#9ca3af", "#555555"],
          ]
        ),
        emptyLine(),

        // ============ FOOTER ============
        new Paragraph({ children: [], spacing: { before: 2000 } }),
        divider(),
        new Paragraph({
          children: [new TextRun({ text: `${APP_NAME}  —  Complete System Documentation`, size: 18, color: colors.gray, italics: true })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated on ${new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}`, size: 18, color: colors.gray, italics: true })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: "Built with Next.js 16 · TypeScript · Tailwind CSS · Zustand", size: 18, color: colors.gray, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
      ],
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
const outputPath = "C:/Users/kareithi/pos/This-POS-System-Documentation.docx"
fs.writeFileSync(outputPath, buffer)
console.log(`Documentation generated: ${outputPath}`)
