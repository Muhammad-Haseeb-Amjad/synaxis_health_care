# Synaxis Health Care Admin Terminal

Complete functional, technical, database, deployment, and maintenance documentation.

> Snapshot: 21 September 2026. This guide describes the maintained application through commit `7f95741` and database migrations `0001`–`0006`.

## 1. Overview

Synaxis Health Care Admin Terminal is an authenticated, responsive business-management Progressive Web App (PWA). It replaces separate workbook-style records with live relational modules, calculated totals, realtime refresh, PDF reports, and mobile file sharing.

The application manages:

- Operational dashboard and recent activity.
- Doctors and monthly business ledgers.
- Customers and debit/credit ledgers.
- Vendors and debit/credit ledgers.
- Shared Product Master.
- Purchase orders and tax-inclusive line items.
- Partnership Groups A/B, sales, expenses, draws, and settlement.
- Warranty invoices and reference-format PDFs.
- Company identity, logos, PDF branding, and commission settings.
- PWA installation and service-worker updates.

The React frontend talks directly to Supabase. Supabase provides authentication, PostgreSQL, Row Level Security (RLS), realtime changes, stored functions, triggers, and Storage. Vercel hosts the static production build.

## 2. Technology stack

| Layer | Technology | Role |
|---|---|---|
| UI | React + TypeScript | Pages and workflows |
| Build | Vite | Development and production bundle |
| Routing | React Router | SPA routes and protected navigation |
| Server state | TanStack Query | Fetch, cache, mutation, invalidation |
| Forms | React Hook Form | Form state and dynamic rows |
| Validation | Zod | Client validation |
| Styling | Tailwind CSS + custom CSS | Responsive dark glassmorphic UI |
| Charts | Recharts | Dashboard trend chart |
| Notifications | React Hot Toast | User feedback |
| PDFs | jsPDF + jspdf-autotable | Reports, statements, POs, invoices |
| Backend | Supabase | Auth, PostgreSQL, RLS, RPC, realtime, Storage |
| PWA | vite-plugin-pwa + Workbox | Installation, cache, updates |
| Hosting | Vercel | Production and preview deployments |

## 3. Repository structure

```text
stitch_synaxis_health_care_admin_panel/
├── public/
│   ├── assets/             # Login image and signature
│   ├── icons/              # PWA/favicon/maskable icons
│   └── manifest.json       # PWA metadata
├── src/
│   ├── components/         # Shell, protected route, cards, modal
│   ├── hooks/              # Auth, PDF share, realtime, animation
│   ├── lib/                # Supabase, calculations, PDF generators
│   ├── pages/              # Routed modules
│   ├── App.tsx             # Route map and QueryClient
│   ├── main.tsx            # Bootstrap and stale-chunk recovery
│   └── styles.css          # Design system and mobile cards
├── supabase/
│   ├── migrations/         # Ordered production schema
│   ├── demo_seed.sql       # Manual demo dataset
│   ├── demo_cleanup.sql    # Demo-only cleanup
│   └── DEMO_DATA.md
├── DEPLOYMENT.md
├── PROJECT_DOCUMENTATION.md
├── package.json
├── vercel.json
└── vite.config.ts
```

## 4. Runtime architecture

### Startup

`src/main.tsx` validates `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Missing variables produce a readable configuration screen. It mounts the router/application and detects stale dynamically imported chunks after deployments. On a stale-chunk error it requests service-worker updates and reloads once.

`supabaseClient.ts` creates the shared browser client. Only the publishable anonymous key belongs in the frontend. Authorization is enforced by RLS; a service-role key must never be exposed.

### Authentication

- Supabase email/password sign-in.
- `useAuth` loads the session and listens for changes.
- `ProtectedRoute` sends unauthenticated users to `/login` and remembers the intended path.
- Logout calls `supabase.auth.signOut()`.
- All operational tables require the `authenticated` role through RLS.

### Query and realtime model

- TanStack Query default stale time: 30 seconds; retry: one.
- Successful mutations invalidate affected query keys.
- `useRealtimeRefresh` subscribes to PostgreSQL changes and invalidates related caches.
- Overview and detail totals therefore update without manual data copying.

### Shared application shell

- Collapsible desktop sidebar persisted in `localStorage`.
- Slide-in mobile navigation.
- Quick Actions for common pages and creation flows.
- Settings and logout controls.
- Responsive navy/teal glassmorphic design.
- Dense tables convert to labeled mobile cards.

## 5. Route map

All routes except `/login` are protected.

| Route | Module |
|---|---|
| `/login` | Authentication and PWA installation |
| `/` | Dashboard |
| `/doctors/overview` | All Doctors Overview |
| `/doctors` | Doctor management |
| `/doctors/:id` | Doctor monthly ledger |
| `/customers` | Customer management and summary |
| `/customers/:id` | Customer ledger |
| `/vendors` | Vendor management |
| `/vendors/:id` | Vendor ledger |
| `/products` | Product Master |
| `/purchase-orders` | PO list |
| `/purchase-orders/new` | New PO |
| `/purchase-orders/:id` | View/edit PO |
| `/partnership` | Partnership overview/settlement |
| `/partnership/group-a` | Group A sales |
| `/partnership/group-b` | Group B sales |
| `/partnership/expenses` | Shared expenses |
| `/warranty` | Warranty invoice list |
| `/warranty/new` | New warranty invoice |
| `/warranty/:id` | View/edit warranty invoice |
| `/settings` | Company settings |

Unknown routes redirect to `/`.

## 6. Modules

### 6.1 Login and PWA

The login screen validates email/password, supports password visibility, displays useful auth errors, and uses the Synaxis branded background.

The custom Download App flow:

- Detects installed mode through `display-mode: standalone` and iOS `navigator.standalone`.
- Captures/deferes Android Chrome's `beforeinstallprompt` event.
- Hides after `appinstalled`.
- Shows Share → Add to Home Screen instructions on iOS Safari.
- Does not permanently remember a dismissed prompt.

The PWA uses auto-updating Workbox, standalone portrait display, brand icons, a maskable icon, static-asset caching, `skipWaiting`, and `clientsClaim`.

### 6.2 Dashboard

Summary cards:

- Total doctors, customers, vendors, and purchase orders.
- Current-month doctor business.
- Customer outstanding.
- Vendor payable.
- Current-month partnership revenue.

Also provided:

- 12-month doctor-business area chart.
- Quick creation links.
- Five latest POs.
- Five latest combined customer/vendor ledger entries.

Account totals use:

```text
balance = opening balance + sum(debits) - sum(credits)
dashboard contribution = max(balance, 0)
```

### 6.3 Doctors

#### Overview

- Read-only required/achieved/remaining table.
- Total doctors, required business, and achieved business cards.
- Doctor links open the detail ledger.

#### Management

- Search, create, edit, and delete doctor headers.
- Fields: name, given amount, percentage.
- Required Business is read-only and calculated live.
- Deleting a doctor cascades to monthly entries.

```text
required business = given amount / (percentage / 100)
```

Blank/invalid/zero percentages return no live target; persisted fallback is zero.

#### Detail ledger

- Summary of name, given amount, percentage, required business.
- Monthly rows: month, product, quantity, price, generated business.
- Add/edit/delete rows; optional Product Master link.

```text
business = quantity × price
business achieved = sum(business)
remaining business = required business - achieved business
```

Doctor PDF: header metrics, all entries, achieved total, remaining total.

### 6.4 Customers

- Customer fields: name, phone, opening balance.
- Search, CRUD, current balance, name/View Details links.
- Customer deletion cascades to ledger rows.
- Send Summary creates an all-customer PDF and total outstanding.

Customer detail provides dated debit/credit CRUD and running balances:

```text
next balance = prior balance + debit - credit
```

Customer Statement PDF contains identity, opening balance, ledger, running balance, and closing total.

### 6.5 Vendors

Vendor fields are name, phone, address, and opening balance. The module mirrors customer ledger behavior and produces a Vendor Statement PDF.

Purchase-order integration automatically maintains one vendor-ledger debit per non-cancelled PO:

- Insert/update PO → upsert `Auto: PO######` debit.
- Cancel PO → remove automatic row.
- Delete PO → cascade automatic row.
- Partial unique index prevents duplicate automatic PO rows.

Manual vendor ledger entries remain separate.

### 6.6 Product Master

Shared catalog fields:

- Unique item code.
- Item name.
- Cost/unit price.
- Sale price.
- Tax percentage (0–100).
- Optional pack size.

Used by POs, partnership sales, doctor entries, and warranty invoices. Product selection copies values into transaction snapshots. Product deletion generally sets foreign keys to null while historical text/prices remain.

### 6.7 Purchase Orders

PO header captures generated read-only number, dates, vendor, vendor snapshots, Ship To details, note, status, and stored total. Statuses: `Pending`, `Completed`, `Cancelled`.

The editor supports inline vendor creation and dynamic product/custom lines. Product selection fills description, price, and tax. Tax is snapshotted so later catalog changes do not alter existing orders.

```text
subtotal = quantity × price
tax = subtotal × tax percentage / 100
line total = quantity × price × (1 + tax percentage / 100)
PO total = sum(line totals)
```

Editing replaces submitted line items. If child insertion fails for a new PO, the new header is removed. The PO PDF includes branding, vendor/Ship To details, tax-inclusive lines, note, total, and Completed stamp.

### 6.8 Partnership

The module models Partner 1/Group A and Partner 2/Group B.

#### Sales

Each row contains month, optional product, item snapshots, quantity, cost price, selling price, bounce/return quantity, and return cost.

```text
cost = quantity × cost price
revenue = quantity × selling price
bounce cost = return quantity × cost price
commission = revenue × configured commission rate
profit = revenue - cost - bounce cost - commission
margin % = profit / revenue × 100
```

Default commission is 10%, configurable in Settings.

#### Shared expenses and draws

Expenses contain date, description, amount, payer (`partner1` or `partner2`), and notes. Each partner bears half for profit sharing, while the actual payer is retained for reimbursement.

Draws contain partner, date, description, and non-negative amount.

```text
raw profit share = (Group A profit + Group B profit) / 2
expense share = shared expenses / 2
profit share remaining = raw profit share - expense share - draws
```

#### Equal-profit settlement

```text
combined profit = Group A profit + Group B profit
net distributable = combined profit - shared expenses
fair share each = combined profit / 2 - shared expenses / 2
partner 1 take-home = Group A profit - expense share
partner 2 take-home = Group B profit - expense share
partner 1 adjustment = fair share each - partner 1 take-home
partner 2 adjustment = fair share each - partner 2 take-home
```

When Partner 2 paid shared expenses personally:

```text
partner 2 reimbursement = max(partner 2 expenses paid, 0) / 2
final partner 1 adjustment = base partner 1 adjustment - partner 2 reimbursement
```

Draws change personal remaining entitlement but are tracked separately from the inter-group transfer.

Partnership Summary PDF includes branded group performance, both partner cards, Profit, draws, expense metrics, individual draw entries, itemized shared expenses, wrapped settlement text, and safe page overflow.

### 6.9 Warranty invoices

#### List

- Search by invoice number or M/s.
- Shows date, item count/summary, net amount, and actions.
- View/Edit and delete (items cascade).

#### Editor

- RPC proposes the next `INV######` number.
- Number remains editable but uniqueness is checked.
- Header: M/s, address, date, city, sector, salesman, phone, username, summary number, page label.
- Lines: Qty, Bns, Description, Pack, Batch, Expiry, Rate, Amount, S-Tax, A-Tax, Discount %, Net.
- Product selection fills description, sale price, and pack.
- Edit updates header, deletes old lines, inserts submitted lines.
- New-header cleanup runs if line insertion fails.
- Successful save refetches list and navigates to `/warranty`.
- PDF is prepared after form changes so `navigator.share` can stay tied to the user's tap.

```text
line amount = quantity × rate
line discount = amount × discount percentage / 100
line net = amount - discount - sales tax - advance tax
invoice net = gross - discounts - X discount - GRN - credit note - taxes
```

The Warranty PDF deliberately follows the approved AXIM Health Care monochrome reference. Synaxis appears in the signature block. It contains the exact grid, compact totals boxes, item count, legal warranty paragraph, Urdu clause image, signature, and printed timestamp.

### 6.10 Company Settings

Manages the singleton company profile:

- Company name, admin name, phone, email, address.
- Public logo.
- Distributor commission percentage.

Logo files upload to the public `company-assets` bucket. Allowed formats: PNG, JPEG, WebP, SVG; limit: 5 MB; object management requires authentication.

The schema also supports `warranty_authorized_person` and `warranty_business_address`. Warranty PDF reads them and falls back to admin/address. These two fields are not currently exposed by the Settings form.

## 7. PDF and sharing system

| Generator | Output |
|---|---|
| `generateCustomersSummaryPdf.ts` | Customer balances summary |
| `generateLedgerPdf.ts` | Customer/vendor statement |
| `generateDoctorPdf.ts` | Doctor business report |
| `generatePOPdf.ts` | Purchase order |
| `generatePartnershipPdf.ts` | Partnership summary |
| `generateWarrantyPdf.ts` | Warranty invoice |

Most PDFs use `pdfBranding.ts` and `company_settings`; Warranty is the intentional fixed-letterhead exception.

`sharePdf` validates a non-empty `application/pdf` Blob:

- Supported mobile: creates a `File` and calls `navigator.share({ files })`.
- Unsupported desktop/browser: downloads and explicitly tells the user to attach manually.
- `wa.me` is not used because it cannot attach files.
- User cancellation is not reported as generation failure.

## 8. Database dictionary

| Table | Purpose | Key behavior |
|---|---|---|
| `doctors` | Doctor targets | Stores given, percentage, required business |
| `doctor_entries` | Monthly business | Doctor FK; optional product; generated business |
| `customers` | Customer master | Opening balance; ledger cascade |
| `customer_ledger` | Customer transactions | Debit/credit rows |
| `vendors` | Vendor master | Contact/address/opening balance |
| `vendor_ledger` | Vendor transactions | Optional unique PO reference |
| `products` | Shared catalog | Unique code, cost, sale, tax, pack |
| `purchase_orders` | PO header | Unique number, vendor snapshots, status, total |
| `purchase_order_items` | PO lines | Generated tax-inclusive amount |
| `partners` | Two partner identities | Group constrained to A/B |
| `partnership_sales` | Monthly group sales | Product snapshot and profit inputs |
| `shared_expenses` | Partnership costs | Date, amount, payer, notes |
| `partner_draws` | Withdrawals | Partner FK, date, non-negative amount |
| `warranty_invoices` | Invoice header/totals | Unique number, customer snapshot |
| `warranty_invoice_items` | Invoice lines | Generated amount/net |
| `company_settings` | Singleton configuration | Branding, commission, warranty fields |

### Relationships and deletion

- Doctor → entries: cascade.
- Customer → ledger: cascade.
- Vendor → ledger: cascade.
- PO → items/automatic ledger: cascade.
- Partner → draws: cascade.
- Warranty invoice → items: cascade.
- Product references: set null where configured, preserving transaction snapshots.
- Warranty customer: set null while customer snapshot remains.

### Generated data and functions

- `doctor_entries.business = qty × price`.
- `purchase_order_items.amount = qty × price × tax multiplier`.
- Warranty item amount/net are generated.
- `generate_next_po_number()` allocates table-locked `PO######` values.
- `generate_next_warranty_invoice_number()` allocates table-locked `INV######` values.
- `sync_purchase_order_vendor_ledger()` maintains automatic PO debits.
- Company singleton index allows one settings row.

### Security

- RLS enabled on every business table.
- CRUD policies require `auth.role() = 'authenticated'`.
- Authenticated role receives table CRUD.
- Number-generator RPCs are denied to public/anon and granted to authenticated.
- Storage management is restricted to authenticated users in `company-assets`.

## 9. Migration history

Apply in numeric order; never rewrite an applied production migration.

| File | Purpose |
|---|---|
| `0001_init.sql` | Core tables, indexes, RLS, grants, PO numbering |
| `0002_company_assets.sql` | Logo bucket and policy |
| `0003_purchase_order_tax.sql` | PO tax snapshot and generated total |
| `0004_monthly_partnership_catalog_and_po_ledger.sql` | Month/product, sale price, commission, draws, PO ledger sync |
| `0005_warranty_invoices.sql` | Product pack, Warranty tables/RPC/RLS |
| `0006_shared_expense_payer.sql` | Expense payer and check constraint |

## 10. Demo data

Demo scripts are manual and never run during build/deploy.

- `demo_seed.sql` uses deterministic UUID ranges, replaces only its own records, runs transactionally, and verifies counts.
- It covers doctors, entries, customers/ledgers, partners/sales, expenses, vendors/ledgers, products, POs/items.
- `demo_cleanup.sql` removes only deterministic demo rows.
- After migration `0006`, expense `paid_by` defaults to `partner1` unless specified.

## 11. Local setup

Requirements: Node.js 20+ recommended, npm, Supabase project, and Supabase Auth admin user.

Create `.env` from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Never commit `.env`, database passwords, JWT secrets, or service-role keys.

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

Apply migrations through Supabase CLI or SQL Editor. Frontend deployment does not run database migrations.

## 12. Vercel deployment

- Root Directory: `stitch_synaxis_health_care_admin_panel`.
- Framework: Vite.
- Build: `npm run build`.
- Output: `dist`.
- Add both Supabase variables for Production, Preview, Development.

`vercel.json` rewrites all URLs to `/index.html` for React Router deep links.

Supabase production checklist:

- Correct Site URL and redirect domains.
- All migrations applied.
- RLS and grants present.
- Storage bucket present.
- Authenticated admin created in Supabase Auth.

## 13. Validation and failure handling

- Zod validates major forms; database constraints enforce final integrity.
- Toasts surface mutation and PDF errors.
- Destructive actions require confirmation.
- New PO/Warranty flows clean up headers when child insertion fails.
- PDF Blob type/size is checked.
- Loading, error, and empty states are implemented.
- Missing deployment variables show a configuration page instead of a blank crash.

## 14. Verification checklist

After meaningful changes verify:

1. Login, protected redirect, logout.
2. Dashboard metrics and chart.
3. Doctor target calculation and overview refresh.
4. Customer/vendor ledger running balances.
5. Product autofill in PO and Warranty.
6. Unique PO number and automatic vendor debit.
7. PO cancellation removes automatic debit.
8. Partnership month filtering covers sales, draws, expenses, settlement.
9. Expense payer affects reimbursement correctly.
10. Warranty create → save → list round-trip.
11. PDFs contain current data with no clipping.
12. Mobile share includes actual PDF file.
13. Desktop fallback downloads with instructions.
14. PWA install/standalone launch on physical mobile.
15. Direct production-route refresh.
16. `npm run build` and `npm run lint` as appropriate.

## 15. Troubleshooting

### Configuration screen

Add both Vite Supabase variables to the active environment, then rebuild/redeploy.

### Permission failure

Confirm authentication, latest migrations, RLS policies, and authenticated grants.

### Missing column/table

Apply the latest migration. Deploying frontend code does not update Supabase.

### Vercel 404 on refresh

Confirm Root Directory and `vercel.json` SPA rewrite.

### Old JS chunk after deploy

The app attempts one service-worker update/reload. If stale, close installed PWA windows and clear the site's cache/service worker.

### PDF sharing failure

Use HTTPS and a supported mobile browser. Native share must remain associated with the user click. Unsupported environments download intentionally.

### Missing PDF logo

Confirm `company_settings.logo_url` is publicly reachable. Image failure falls back to textual branding.

### Stale PO vendor ledger

Confirm migration `0004` and trigger exist, then update/save the PO to resynchronize.

## 16. Maintenance guidance

- Add new numbered migrations; do not edit applied migrations.
- Keep frontend formulas and generated database expressions aligned.
- Preserve snapshots on historical transactions.
- Invalidate every affected TanStack Query key after mutations.
- Reuse shared PDF branding and sharing helpers.
- Render PDFs to images during QA.
- Test financial changes with both directions, zeros, large values, and overdraws.
- Commit the lockfile; `package.json` uses `latest` ranges.
- Back up production Supabase before real-data go-live.
- Remove demo data before client data entry.

## 17. Current implementation considerations

- Top-bar global search is presently visual; module search fields perform filtering.
- Notification and Help buttons are placeholders.
- Warranty authorized person/address exist in schema but are not exposed in Settings UI.
- Most currency displays round to whole PKR; settlement headline preserves two decimals.
- Warranty PDF uses fixed AXIM header by client instruction; other PDFs use settings.
- Native file sharing requires deployed HTTPS and physical-device verification.
- `company-assets` is public; do not upload confidential documents there.

## 18. Security and data safety

- Manage admin credentials only in Supabase Auth.
- Never document or commit passwords, service keys, or database credentials.
- Production data stays in Supabase, not source files.
- Cascading deletes remove owned ledger/item rows and require care.
- Enable Supabase backups before production use.
- Demo scripts are identifiable and reversible without touching non-demo rows.

## 19. Summary

Synaxis Health Care Admin Terminal is a protected operational PWA backed by a relational Supabase model. Product Master supplies shared catalog data; focused modules manage doctors, customers, vendors, orders, partnership, and warranty invoices; realtime cache invalidation keeps summaries current; and the shared PDF/share subsystem produces mobile-shareable business documents from live records.
