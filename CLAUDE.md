# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Achado (formerly Car Tracker; repo and Vercel project still use the old name) is a hosted car search tracker for browsing used car listings in Portugal. SvelteKit + TypeScript frontend, SvelteKit endpoints for the API, Supabase Postgres for persistence, deployed on Vercel (Node 22, Fluid Compute).

## Commands

- **Install deps:** `npm install`
- **Local dev:** `npm run dev`
- **Type check:** `npm run check`
- **Tests:** `npm test`
- **Build:** `npm run build`
- **Migrate `data.json` → Supabase:** `npm run migrate` (one-time, script kept in case of re-seeding)
- **Deploy to prod:** `vercel --prod`

## Architecture

- **`src/routes/+layout.svelte`** — Mounts Header, overlays (`?car=<id>`, `?edit=new|<id>`, `?compare=<id>,<id>`), the compare tray, toasts, dialogs. Locks body scroll while an overlay is open. Skips chrome on `/login` and `/share/*`.
- **`src/routes/+layout.server.ts`** — Auth guard: redirects unauthenticated users to `/login` (except `/login`, `/share/*`, `/share-target`, `/auth/*`). Returns `user` in layout data.
- **`src/routes/{pipeline,list}/+page.svelte`** — The two views in the header nav. `/docs` ("How the score works") is linked from the score breakdown and the account menu, not the nav. `/compare` and `/score-lab` only redirect: compare is the `CompareOverlay` (opened from the List bulk bar or "Compare" on a car's panel, via `CompareTray`), and the score sandbox is the "What if" box in `CarDetailPanel` plus the live score in `CarForm`.
- **`src/routes/login/+page.svelte`** — Email + password form. Server action calls `supabase.auth.signInWithPassword`. Users are pre-provisioned via the Supabase dashboard (no signup flow exposed).
- **`src/routes/auth/logout/+server.ts`** — POST endpoint, signs out and redirects to `/login`.
- **`src/routes/api/cars/+server.ts`** — `GET` (list + staleness flip) and `POST` (create).
- **`src/routes/api/cars/[id]/+server.ts`** — `PUT` (optimistic-lock on `version`) and `DELETE`.
- **`src/hooks.server.ts`** — Builds a Supabase server client per request, populates `event.locals.{supabase,user}`, gates `/api/*` on `user`, applies `rateLimit`.
- **`src/lib/server/*`** — Server-only module boundary. SvelteKit prevents client imports at build time. Holds `supabase.ts` (lazy service-role client, proxy-wrapped), `supabase-auth.ts` (per-request SSR client factory), `rate-limit.ts`.
- **`src/lib/supabase-browser.ts`** — Browser Supabase client (cookie session, anon key) for client-side auth state.
- **`src/lib/scoring/*`** — Pure client-side score computation. `cachedScore`/`cachedScoreBreakdown` keyed on `id+version`.
- **`src/lib/stores/*`** — Svelte writable stores: cars, filters, compare, ui (toasts/dialog/pending), bulk (multi-select).
- **`src/lib/api.ts`** — `apiFetch` wrapper relying on session cookies; on `401` it redirects to `/login?next=…`.
- **`scripts/schema.sql`** — Run once in Supabase SQL Editor to create the `cars` table.
- **`scripts/migrations/`** — Incremental SQL patches; run in filename order.
- **`scripts/migrate.js`** — One-time import from `data.json` into Supabase.
- **`scripts/capture-baselines.mjs`** — Re-run to re-pin score fixtures in `tests/scoring/index.test.ts` (run via `npx tsx --env-file=.env scripts/capture-baselines.mjs`).

## Environment Variables

Use Supabase's new "Publishable and secret API keys" (Settings → API). The legacy `anon` / `service_role` JWT-style keys are being phased out.

- `PUBLIC_SUPABASE_URL` — Supabase project URL. Public (exposed to browser); used by both the SSR auth client and the secret-key client.
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Publishable key (`sb_publishable_…`). Public; respects RLS on its own. Replaces the legacy `anon` key.
- `SUPABASE_SECRET_KEY` — Secret key (`sb_secret_…`). **Server-only**; bypasses RLS. Replaces the legacy `service_role` key. API endpoints use this after the session check passes.

## Supabase dashboard config (one-time)

- **Authentication → Providers → Email**: enable. Disable "Allow new users to sign up" so only pre-provisioned users can authenticate.
- **Authentication → Users → Add user**: create accounts for Pedro and his girlfriend with **Auto Confirm User** checked, and set a password directly. Password reset is done from the dashboard, not the app (no `/forgot-password` route — there are only two users).

## Key Domain Concepts

- **Car Score (0-100):** Computed client-side from km (22%), price (22%), reliability (30%), year (13%), location (13%). `kmSubscore` uses a fuel-aware sweet-spot curve (petrol plateau 0–90k → 0 at 200k; diesel plateau 0–130k → 0 at 280k) and deliberately does not reward suspiciously low km (rollback fraud). `priceSubscore` is a three-zone piecewise curve anchored on the €5000 budget: plateau at 100 from €0–€2500, linear decay to 50 at €5000, second decay to 0 at €7500. Soft tail past budget lets over-budget unicorns still rank. `locationScore` uses a dampened curve (max 30-point penalty across 600km from Viana do Castelo). `reliabilitySubscore` combines a make baseline with an engine-specific delta. Cars with missing km, price, or location return a neutral 50.
- **Status pipeline:** `to-contact → contacted → negotiating → final-offer`, with `dismissed` as a parallel terminal state (last in `STATUSES`, so it renders last). Pipeline columns sort by score; Contacted sorts by days left before auto-dismiss. Auto-generated: `contacted` cars with no update for 3+ days flip to `dismissed` (see `src/lib/staleness.ts`, `STALE_AFTER_DAYS`). `dismissed` cars are hidden from List and Compare views (visible only in Pipeline, where the column is collapsible).
- **Suspicion check (`src/lib/scoring/suspicion.ts`):** Each flag has a weight (1 weak, 2 meaningful, 3 strong). Total ≥ `HIGH_RISK_WEIGHT` (4) = "Likely scam", >0 = "Suspicious". Seller/listing flags (new account, imported + low km, scam-script wording, few photos) need the listing-signal columns, which only the StandVirtual importer fills today (OLX blocks server-side fetches from dev machines, so its page structure is unverified).
- **Listing-signal columns (migration 005):** `sellerType`, `sellerSince`, `listedAt`, `gearbox`, `owners`, `warrantyMonths`, `imported`, `photoCount`, `description`. All optional; run the migration before deploying code that writes them.
- **Price history:** Appended on PUT when price changes. The `priceNote` field is accepted in requests but stripped from the stored object.
- **`contactedAt` and staleness clock:** Set automatically when status becomes `contacted`. Preserved when a stale `contacted` car flips to `dismissed`, so a manual roll-back to `contacted` can re-arm the clock. Cleared when status moves to anything other than `contacted` or `dismissed`.
- **Version field:** Every car has an integer `version`. PUT requires the client's seen version; mismatch returns 409 and the client refreshes.
- **Sources:** StandVirtual, AutoScout24, OLX, Facebook Marketplace, PiscaPisca, Other.
- **Fuel types:** Diesel, Gasolina.

## Design Notes

- Warm light "atelier" theme (cream backgrounds, ink text, muted green accent) defined as CSS variables in `src/app.css`. There is no dark mode yet. Brand mark is a Portuguese number plate (`PlateMark.svelte`); rules in `DESIGN.md`.
- Component styles live in scoped `<style>` blocks inside each `.svelte` file. `:global(...)` only where necessary.
- Portuguese-market context: prices in euros, Portuguese car listing sources. All status labels are in English.
- No Tailwind, no CSS framework, no UI library.

## Gotchas

- **Supabase column names are camelCase and quoted** (`"addedAt"`, `"contactedAt"`, `"priceHistory"`) so JS objects pass through unchanged. Any new column with a capital letter must be created with double quotes in SQL.
- **RLS is enabled with no policies.** All access goes through SvelteKit endpoints using the service role key. Never import from `$lib/server/*` in a client module — SvelteKit enforces this at build time.
- **Auth is per-user via Supabase email + password.** Session lives in `sb-*` httpOnly cookies (set by `@supabase/ssr`). The previous shared-password / `x-api-secret` model is gone.
- **Initial cars load is client-side** (`+layout.ts` guards with `if (browser) && data?.user`). API endpoints rely on the session cookie; SSR pre-renders the chrome but the cars list still hydrates after mount.
- **`priceNote` is transient:** Accepted in PUT requests but `delete`d from the stored car object before writing — it only appears in the `priceHistory` entry's `note` field.
- **Rate-limit bucket is per-instance** (Fluid Compute). Matches legacy behaviour. Move to Upstash if ever needed.
- **Score parity fixtures** in `tests/scoring/index.test.ts` are regression guards. If they drift, investigate before updating — the algorithm changed.
- **Two humans share one list:** Pedro and his girlfriend each have their own Supabase Auth user, but there is no per-user data scoping on the `cars` table — everyone sees the same list.
