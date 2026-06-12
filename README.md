# ICOS — Import Commerce Operating System

ICOS is the business backbone for **American Home Ventures** — an ERP/commerce platform for an import-based retail business. It digitizes import tracking, inventory control, point-of-sale, customer & credit management, agent commissions, and financial reporting.

This repository is a **pnpm + TypeScript monorepo** containing the web apps, a mobile app, shared packages, and the Supabase backend (schema + edge functions).

> Status: early development. The web apps currently render with mock data; the Supabase schema and edge functions define the real backend that the apps will be wired up to.

## Architecture

```
American-Homes/
├── apps/
│   ├── admin-dashboard/   # Next.js 14 admin panel (shipments, inventory, credit, agents, audit)  → port 3000
│   ├── pos-system/        # Next.js 14 POS with offline order queue                                → port 3001
│   └── mobile-app/        # Expo / React Native app (customer-facing, placeholder)
├── packages/
│   ├── types/             # @icos/types — shared domain models & enums (single source of truth)
│   ├── utils/             # @icos/utils — currency math, IndexedDB offline queue, payment simulators
│   └── ui/                # @icos/ui    — shared React components (Button, Card, Badge, InputField, Modal)
└── supabase/
    ├── migrations/        # PostgreSQL schema (tables, RLS, triggers)
    └── functions/         # Edge functions (sync-orders, process-withdrawal)
```

Apps consume the shared packages via the `workspace:*` protocol (e.g. `"@icos/ui": "workspace:*"`), so a change to a package is picked up by every app without publishing.

### Tech stack
- **Monorepo:** pnpm workspaces
- **Web:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Mobile:** Expo / React Native
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions on Deno)

## Prerequisites
- **Node.js** >= 18
- **pnpm** >= 9 — install with `npm install -g pnpm`
- (Optional, for backend work) the **Supabase CLI** — see https://supabase.com/docs/guides/cli

## Getting started

Install all workspace dependencies from the repo root:

```bash
pnpm install
```

### Run the apps

Use pnpm's `--filter` flag to target a single app:

```bash
# Admin dashboard  → http://localhost:3000
pnpm --filter admin-dashboard dev

# POS system       → http://localhost:3001
pnpm --filter pos-system dev

# Mobile app (Expo)
pnpm --filter mobile-app start
```

### Build for production

```bash
pnpm --filter admin-dashboard build
pnpm --filter pos-system build
```

## Environment variables

The apps talk to Supabase and therefore need its URL and **anon** key. Create a `.env.local` in each Next.js app (these files are gitignored):

```bash
# apps/admin-dashboard/.env.local  and  apps/pos-system/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> Never commit the Supabase **service_role** key or any other secret. The `service_role` key bypasses Row-Level Security and grants full admin access to the database — keep it server-side only (e.g. as an edge-function secret), never in the repo or in client code.

## Backend (Supabase)

The database schema lives in `supabase/migrations/`. Edge functions live in `supabase/functions/`:
- `sync-orders` — reconciles orders queued offline by the POS.
- `process-withdrawal` — validates and processes agent wallet withdrawals (mobile-money payouts).

With the Supabase CLI linked to your project:

```bash
supabase db push                      # apply migrations
supabase functions deploy sync-orders
supabase functions deploy process-withdrawal
```

## Project documentation

Additional design notes live at the repo root:
- `DOCUMENT 1 — SYSTEM DESIGN + SUPABASE DATABASE BLUEPRINT.txt`
- `DOCUMENT 2 — FULL PROJECT DOCUMENTATION.txt`
- `MVP.txt` — phased development roadmap

## Roadmap (summary)

- **Phase 1 (MVP):** Products, Inventory, POS, Orders, Customers, Payments, Reports
- **Phase 2:** E-commerce, customer accounts, wishlist, cart, order tracking
- **Phase 3:** Delivery system, mobile app, notifications
- **Phase 4:** Vendors, multiple warehouses, multi-seller support
- **Phase 5:** WhatsApp ordering, Instagram sync, AI automation

See `MVP.txt` for the full breakdown.
