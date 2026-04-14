# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Car Tracker is a hosted car search tracker for browsing used car listings in Portugal. It uses a no-framework stack: plain HTML/JS frontend (single `index.html` with inline CSS/JS), Vercel serverless functions for the API (`api/*`), and Supabase Postgres for persistence.

## Commands

- **Install deps:** `npm install`
- **Local dev:** `vercel dev` (run from project root; needs Vercel CLI: `npm i -g vercel`)
- **Migrate `data.json` → Supabase:** `npm run migrate` (one-time, script kept in case of re-seeding)
- **Deploy to prod:** `vercel --prod`

No tests, linter, or build step.

## Architecture

- **`index.html`** — Single-file SPA with all CSS and JS inline. Three views: Pipeline (Kanban), List (grid with sort/filter), Compare (side-by-side table). Includes a detail side panel and add/edit modal. `apiFetch()` wrapper injects `x-api-secret` header on every request; on 401 it clears `localStorage.apiSecret` and re-prompts.
- **`api/cars.js`** — Serverless function: `GET` (list) and `POST` (create). On GET, applies staleness migration and persists any status flips.
- **`api/cars/[id].js`** — Serverless function: `PUT` (update) and `DELETE` (delete).
- **`lib/supabase.js`** — Shared Supabase client using service role key (bypasses RLS).
- **`lib/auth.js`** — `requireSecret(req, res)` guard — checks `x-api-secret` header against `API_SECRET` env var; 401s on mismatch.
- **`lib/staleness.js`** — Pure function `applyStaleness(cars)` that mutates in place and returns the list of rows whose status changed (for the handler to persist).
- **`scripts/schema.sql`** — Run once in Supabase SQL Editor to create the `cars` table.
- **`scripts/migrate.js`** — One-time import from `data.json` into Supabase.
- **`vercel.json`** — Forces `framework: null` so Vercel doesn't auto-detect any preset.
- **`car-tracker-prompt.md`** — Original specification document (data model, scoring formula, UI intent).

## Environment Variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase project URL + **secret** key (not publishable). Set in `.env` locally and in Vercel project settings for prod.
- `API_SECRET` — Shared password all users type on first load. Stored in `x-api-secret` header.

## Key Domain Concepts

- **Car Score (0-100):** Computed client-side from km (30%), price (30%), year (20%), location proximity (20%). Reference ranges: 0-200k km, €0-€10k price, 2000-2015+ year, 0-600km from Viana do Castelo. Cars without a location get a neutral 50/100 location score.
- **Status pipeline:** `to-contact → contacted → negotiating → rejected → bought`. Auto-generated: `inactive` (contacted with no response for 3+ days). `rejected` cars are hidden from List and Compare views (visible only in Pipeline).
- **Price history:** Appended on PUT when price changes. The `priceNote` field is accepted in requests but stripped from the stored object.
- **`contactedAt` and staleness clock:** Set automatically when status becomes `contacted`. Reset if status is rolled back to `contacted` (e.g., from `inactive`). Cleared when status moves outside the staleness chain (`contacted`/`inactive`).
- **Sources:** StandVirtual, AutoScout24, OLX, Facebook Marketplace, PiscaPisca, Other.
- **Fuel types:** Diesel, Gasolina.

## Design Notes

- Dark theme with CSS variables for all colors.
- No external frontend dependencies — everything is inline in `index.html`.
- Portuguese-market context: prices in euros, Portuguese car listing sources. All status labels are in English.

## Gotchas

- **Supabase column names are camelCase and quoted** (`"addedAt"`, `"contactedAt"`, `"priceHistory"`) so JS objects pass through unchanged. Any new column with a capital letter must be created with double quotes in SQL.
- **RLS is enabled with no policies.** All access goes through serverless functions using the service role key. Do not expose the service role key client-side.
- **`index.html` is 1600+ lines:** All CSS and JS are inline in one file. When editing, search by function name or CSS variable rather than scrolling.
- **`priceNote` is transient:** Accepted in PUT requests but `delete`d from the stored car object before writing — it only appears in the `priceHistory` entry's `note` field.
- **Two humans share one list:** Pedro and his girlfriend both use the same `API_SECRET`; there is no per-user data scoping.
