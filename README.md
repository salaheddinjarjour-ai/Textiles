# TextileHub ERP

A multi-user ERP for a textile business — sales, inventory, purchasing, customers,
suppliers, accounting and reporting — with role-based access control. All amounts
are in **US dollars ($)**.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma +
SQLite · Recharts**. Authentication is a custom JWT session (httpOnly cookie,
bcrypt-hashed passwords).

---

## Getting started

```bash
npm install         # install dependencies
npm run db:reset    # create the SQLite database and load demo data
npm run dev         # start the app at http://localhost:3000
```

> The dev/build scripts use **webpack** (`next dev --webpack`). This project lives
> under a folder path containing a space and an apostrophe, which currently trips
> Next's Turbopack bundler (broken hydration). Webpack handles it correctly.

### Demo logins

All demo accounts use the password **`password123`**.

| Role        | Email                       | Can access                                          |
| ----------- | --------------------------- | --------------------------------------------------- |
| Admin       | admin@textilehub.com        | Everything + user management + settings             |
| Manager     | manager@textilehub.com      | All modules & reports (no user management)          |
| Sales       | sales@textilehub.com        | Sales, customers, reports                           |
| Warehouse   | warehouse@textilehub.com    | Inventory, suppliers, purchases                     |
| Accountant  | accounts@textilehub.com     | Accounting, sales (read), customers (read), reports |

---

## Languages (English / العربية)

The app ships bilingual, with a switcher (`EN | ع`) in the top bar and on the
sign-in page. Choosing Arabic sets `<html lang="ar" dir="rtl">`, mirrors the
entire layout, and swaps to the Cairo Arabic typeface. The choice is stored in
a cookie, so it persists across sessions.

How it works:

- **Translations** live in [`src/lib/i18n/ar.ts`](src/lib/i18n/ar.ts). The
  English text is the key, so anything untranslated falls back to English
  rather than showing a blank or a raw key. To add a string, add one line.
- **Server components** call `const t = await getT()`; **client components**
  call `const t = useT()`.
- **Layout mirroring** uses CSS logical properties (`ms-`/`me-`, `ps-`/`pe-`,
  `start-`/`end-`, `text-start`/`text-end`, `border-s`/`border-e`) rather than
  physical left/right ones, so RTL is automatic — no duplicated styles.
- **Numbers, money and SKUs stay left-to-right** in both languages (USD amounts,
  order numbers and emails read naturally); only month names localise.

## Roles & permissions

Roles form the access hierarchy. Permissions are defined in
[`src/lib/rbac.ts`](src/lib/rbac.ts) and enforced in three places:

1. **Navigation** — the sidebar only shows modules the role can access.
2. **Pages** — every page calls `requirePermission("module:view")`; unauthorized
   users are redirected to the dashboard.
3. **Server actions** — mutations (e.g. creating a user) re-check permissions
   server-side.

## Project structure

```
src/
  app/
    (auth)/login/        # login page + form
    (app)/               # authenticated area (sidebar + topbar shell)
      dashboard/         # KPIs, sales chart, top fabrics, low stock, recent orders
      sales/ inventory/ customers/ suppliers/ purchases/ accounting/ reports/
      users/             # user management (add users, change roles, activate)
      settings/
  components/            # UI: app shell, dashboard widgets, forms
  lib/                   # prisma, auth, rbac, session, formatting, data queries
  middleware.ts          # auth gate + redirects
prisma/
  schema.prisma          # data model
  seed.ts                # demo data (fabrics, customers, ~120 orders, invoices…)
```

## Handy scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the dev server (webpack)            |
| `npm run build`     | Production build                          |
| `npm run db:reset`  | Recreate the DB and reseed demo data      |
| `npm run db:seed`   | Reseed demo data                          |
| `npm run db:studio` | Open Prisma Studio to browse the database |
| `npm run lint`      | Lint the codebase                         |

## Status

All core modules are built and working:

- **Dashboard** — KPIs, 30-day sales chart, top fabrics, low-stock alerts, recent orders
- **Sales** — order list with status filters, order builder (live totals), order detail, status updates, invoice generation
- **Inventory** — product catalog, stock levels & value, product detail with per-lot stock adjustments
- **Customers** — directory with balances, create/edit, detail with order history
- **Suppliers** — directory, create/edit, detail with purchase history
- **Purchases** — purchase-order builder, detail, and "receive stock" into a warehouse
- **Accounting** — A/R summary, invoices, record payments, income/expense ledger
- **Reports** — revenue, sales by category, top customers/products, inventory valuation
- **Settings** — company profile, warehouses, and a roles × permissions matrix
- **Users** — add users, change roles, activate/deactivate (admin only)

Every page enforces role-based access on the server. Currency is USD throughout.

## Deploying

For production, switch the database from SQLite to Postgres (change the
`datasource` in `prisma/schema.prisma` and `DATABASE_URL`), and set a strong
`AUTH_SECRET` in the environment.
