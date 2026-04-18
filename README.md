# Car Tracker

Shared car search tracker for browsing used car listings in Portugal. Deployed to Vercel + Supabase; two people share one list via a shared password.

## Features

- **Pipeline view** — Kanban board organized by status
- **List view** — Sortable and filterable grid of all listings
- **Compare view** — Side-by-side comparison table
- **Docs view** — Scoring weights + make/engine reliability reference
- **Detail panel** — Slide-out panel with full car details
- **Price tracking** — Automatic price history when prices change
- **Car scoring** — 0-100 score based on km, price, reliability, year, and location
- **Auto-staleness** — Cars in `contacted` status auto-transition to `inactive` after 3 days

## Status Pipeline

`to-contact` → `contacted` → `visit-scheduled` → `visited` → `negotiating` → `rejected` / `bought`

Auto-generated: `inactive` (contacted 3+ days with no manual update).

## Supported Sources

StandVirtual, AutoScout24, OLX, Facebook Marketplace, PiscaPisca, Other

---

## Setup

### 1. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com), create a new project (free tier).
2. In the SQL Editor, paste the contents of `scripts/schema.sql` and run it.
3. In **Settings → API**, copy the `Project URL` and the `service_role` key.

### 2. Configure env vars

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and pick a long random `API_SECRET` (e.g. `openssl rand -hex 24`). Both users will type this `API_SECRET` as the "app password" on first load.

### 3. One-time data import

```bash
npm run migrate
```

This reads `data.json` and inserts every car into Supabase.

### 4. Local dev

```bash
npm install
npm run dev
```

Open the URL it prints. Enter your `API_SECRET` when prompted.

### 5. Deploy to Vercel

```bash
npm install -g vercel   # one-time
vercel --prod
```

In the Vercel dashboard, set the three env vars from `.env` under **Settings → Environment Variables** (Production). Redeploy if you added them after the first deploy.

---

## Tech Stack

- **Framework:** SvelteKit (Svelte 5 + runes) on `@sveltejs/adapter-vercel`
- **Language:** TypeScript everywhere
- **Backend:** SvelteKit endpoints (`src/routes/api/*`) + Supabase Postgres
- **Runtime:** Node.js 22 (Vercel Fluid Compute)
- **Auth:** Shared secret in `x-api-secret` header

## Project Structure

```
src/
  app.html                      Document shell
  app.css                       Global tokens + resets
  hooks.server.ts               Auth + rate-limit gate on /api/*
  lib/
    types.ts                    Car, CarStatus, inputs
    validation.ts               Zod schemas
    staleness.ts                applyStaleness() — 3-day contacted → inactive
    inference.ts                URL → inferred fields
    constants.ts                Locations, make/engine reliability
    scoring/                    km, price, year, reliability, location subscores
    api.ts                      Client apiFetch wrapper
    server/                     Server-only: supabase, auth, rate-limit
    stores/                     cars, filters, compare, ui, auth
  components/
    layout/                     Header, toasts, dialogs, password prompt
    ui/                         Selects, combobox, score badge, filters
    car/                        Card, row, detail panel, form, timeline
  routes/
    +layout.svelte              Header + overlay mounts
    +page.ts                    '/' → '/pipeline'
    pipeline/+page.svelte
    list/+page.svelte
    compare/+page.svelte
    docs/+page.svelte
    api/cars/+server.ts         GET + POST
    api/cars/[id]/+server.ts    PUT + DELETE

tests/                          Vitest suites mirroring src/lib/
scripts/
  schema.sql                    Fresh-install schema
  migrations/                   Incremental SQL migrations
  migrate.js                    One-time data.json import
  capture-baselines.mjs         Score parity fixture capture
svelte.config.js                Adapter config
vercel.json                     Framework declaration
```

## Running checks and tests

```bash
npm run check   # svelte-check + TS type check
npm test        # Vitest unit tests
```

## Applying schema migrations

Fresh Supabase project: paste `scripts/schema.sql` into the SQL Editor.

Existing project: paste the contents of each file in `scripts/migrations/` (in
filename order) into the SQL Editor. Migrations are idempotent and safe to
re-run.

## Backup and restore

Supabase automatically takes daily backups on Pro plans (Point-in-Time Recovery
available). On the free tier, backups are **not** automatic — take a manual
dump periodically:

```bash
# One-off: dump the cars table as CSV from Supabase dashboard:
# Table editor → cars → ⋯ menu → Export as CSV

# Or via psql with the connection string from Settings → Database:
pg_dump "$SUPABASE_DB_URL" --data-only --table=cars > cars-backup.sql
```

Restore by running the dump back with `psql`. Store the dump somewhere outside
the repo (iCloud, Drive, or a private gist).
