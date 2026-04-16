# Car Tracker

Shared car search tracker for browsing used car listings in Portugal. Deployed to Vercel + Supabase; two people share one list via a shared password.

## Features

- **Pipeline view** — Kanban board organized by status
- **List view** — Sortable and filterable grid of all listings
- **Compare view** — Side-by-side comparison table
- **Detail panel** — Slide-out panel with full car details
- **Price tracking** — Automatic price history when prices change
- **Car scoring** — 0-100 score based on km, price, year, and location
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
npm install -g vercel   # one-time
vercel dev
```

Open the URL it prints. Enter your `API_SECRET` when prompted.

### 5. Deploy to Vercel

```bash
vercel --prod
```

In the Vercel dashboard, set the three env vars from `.env` under **Settings → Environment Variables** (Production). Redeploy if you added them after the first deploy.

---

## Tech Stack

- **Frontend:** Single `index.html` with inline CSS and JS (no build step)
- **Backend:** Vercel serverless functions (`api/*`) + Supabase Postgres
- **Auth:** Shared secret in `x-api-secret` header

## Project Structure

```
index.html              Single-file SPA (UI, styles, client logic)
api/cars.js             Serverless GET + POST
api/cars/[id].js        Serverless PUT + DELETE
lib/                    supabase client, auth, staleness, validation, rate-limit
lib/__tests__/          Vitest unit tests
scripts/schema.sql      Fresh-install schema
scripts/migrations/     Incremental SQL migrations (run in order)
scripts/migrate.js      One-time data import from data.json
vercel.ts               Vercel project config
```

## Running tests

```bash
npm test
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
