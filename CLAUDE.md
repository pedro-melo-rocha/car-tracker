# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Car Tracker is a hosted car search tracker for browsing used car listings in Portugal. SvelteKit + TypeScript frontend, SvelteKit endpoints for the API, Supabase Postgres for persistence, deployed on Vercel (Node 22, Fluid Compute).

## Commands

- **Install deps:** `npm install`
- **Local dev:** `npm run dev`
- **Type check:** `npm run check`
- **Tests:** `npm test`
- **Build:** `npm run build`
- **Migrate `data.json` → Supabase:** `npm run migrate` (one-time, script kept in case of re-seeding)
- **Deploy to prod:** `vercel --prod`

## Architecture

- **`src/routes/+layout.svelte`** — Mounts Header, overlays (`?car=<id>`, `?edit=new|<id>`), toasts, dialogs, password prompt.
- **`src/routes/{pipeline,list,compare,docs}/+page.svelte`** — One URL per view.
- **`src/routes/api/cars/+server.ts`** — `GET` (list + staleness flip) and `POST` (create).
- **`src/routes/api/cars/[id]/+server.ts`** — `PUT` (optimistic-lock on `version`) and `DELETE`.
- **`src/hooks.server.ts`** — Runs `requireSecret` + `rateLimit` on every `/api/*` request.
- **`src/lib/server/*`** — Server-only module boundary. SvelteKit prevents client imports at build time. Holds `supabase.ts` (service-role client), `auth.ts`, `rate-limit.ts`.
- **`src/lib/scoring/*`** — Pure client-side score computation (km, price, reliability, year, location). Runs in the browser because the `cars` table has no `score` column.
- **`src/lib/stores/*`** — Svelte writable stores: cars, filters, compare, ui (toasts/dialog/pending), auth.
- **`src/lib/api.ts`** — `apiFetch` wrapper that injects `x-api-secret` header and handles 401 by re-prompting.
- **`scripts/schema.sql`** — Run once in Supabase SQL Editor to create the `cars` table.
- **`scripts/migrations/`** — Incremental SQL patches; run in filename order.
- **`scripts/migrate.js`** — One-time import from `data.json` into Supabase.
- **`scripts/capture-baselines.mjs`** — Re-run to re-pin score fixtures in `tests/scoring/index.test.ts` (run via `npx tsx --env-file=.env scripts/capture-baselines.mjs`).

## Environment Variables

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase project URL + **secret** key (not publishable). Set in `.env` locally and in Vercel project settings for prod.
- `API_SECRET` — Shared password all users type on first load. Stored in `x-api-secret` header.

## Key Domain Concepts

- **Car Score (0-100):** Computed client-side from km (22%), price (22%), reliability (30%), year (13%), location (13%). `kmSubscore` uses a fuel-aware sweet-spot curve (petrol plateau 0–90k → 0 at 200k; diesel plateau 0–130k → 0 at 280k) and deliberately does not reward suspiciously low km (rollback fraud). `priceSubscore` plateaus at 100 from €0–€2500, decays to 0 at the €5k ceiling. `locationScore` uses a dampened curve (max 30-point penalty across 600km from Viana do Castelo). `reliabilitySubscore` combines a make baseline with an engine-specific delta. Cars with missing km, price, or location return a neutral 50.
- **Status pipeline:** `to-contact → contacted → visit-scheduled → visited → negotiating → rejected → bought`. Auto-generated: `inactive` (contacted with no response for 3+ days). `rejected` cars are hidden from List and Compare views (visible only in Pipeline).
- **Price history:** Appended on PUT when price changes. The `priceNote` field is accepted in requests but stripped from the stored object.
- **`contactedAt` and staleness clock:** Set automatically when status becomes `contacted`. Reset if status is rolled back to `contacted` (e.g., from `inactive`). Cleared when status moves outside the staleness chain (`contacted`/`inactive`).
- **Version field:** Every car has an integer `version`. PUT requires the client's seen version; mismatch returns 409 and the client refreshes.
- **Sources:** StandVirtual, AutoScout24, OLX, Facebook Marketplace, PiscaPisca, Other.
- **Fuel types:** Diesel, Gasolina.

## Design Notes

- Dark theme with CSS variables defined in `src/app.css`.
- Component styles live in scoped `<style>` blocks inside each `.svelte` file. `:global(...)` only where necessary.
- Portuguese-market context: prices in euros, Portuguese car listing sources. All status labels are in English.
- No Tailwind, no CSS framework, no UI library.

## Gotchas

- **Supabase column names are camelCase and quoted** (`"addedAt"`, `"contactedAt"`, `"priceHistory"`) so JS objects pass through unchanged. Any new column with a capital letter must be created with double quotes in SQL.
- **RLS is enabled with no policies.** All access goes through SvelteKit endpoints using the service role key. Never import from `$lib/server/*` in a client module — SvelteKit enforces this at build time.
- **Initial cars load is client-side** (`+layout.ts` guards with `if (browser)`). The API requires `x-api-secret` which only exists in localStorage; SSR cannot fetch cars.
- **`priceNote` is transient:** Accepted in PUT requests but `delete`d from the stored car object before writing — it only appears in the `priceHistory` entry's `note` field.
- **Rate-limit bucket is per-instance** (Fluid Compute). Matches legacy behaviour. Move to Upstash if ever needed.
- **Score parity fixtures** in `tests/scoring/index.test.ts` are regression guards. If they drift, investigate before updating — the algorithm changed.
- **Two humans share one list:** Pedro and his girlfriend both use the same `API_SECRET`; there is no per-user data scoping.
