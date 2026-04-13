# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Car Tracker is a local-only car search tracker for browsing used car listings in Portugal. It uses a no-framework stack: plain HTML/JS frontend (single `index.html` with inline CSS/JS), Express backend (`server.js`), and `data.json` for file-based persistence.

## Commands

- **Start server:** `npm start` (runs `node server.js`, serves on http://localhost:3000)
- **Install deps:** `npm install` (only dependency is Express)

There are no tests, linter, or build step.

- **Environment:** `PORT` env var overrides the default port 3000 (e.g., `PORT=4000 npm start`).

## Architecture

- **`server.js`** — Express REST API with CRUD endpoints (`/api/cars`). Reads/writes `data.json` synchronously. Includes automatic status staleness logic: cars in `contacted` status auto-transition to `inactive` after 3 days (evaluated on GET). Also migrates legacy `sem-resposta`/`inativo` values to `inactive` on read.
- **`index.html`** — Single-file SPA with all CSS and JS inline. Three views: Pipeline (Kanban), List (grid with sort/filter), Compare (side-by-side table). Includes a detail side panel and add/edit modal.
- **`data.json`** — Array of car objects. Each car tracks price history as an array of `{date, price, note}` entries.
- **`car-tracker-prompt.md`** — Original specification document. Refer to this for the data model, scoring formula, and UI design intent.

## Key Domain Concepts

- **Car Score (0-100):** Computed client-side from km (35%), price (35%), year (20%), status bonus (10%). Reference ranges: 0-200k km, €0-€10k price, 2000-2015+ year.
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

- **Synchronous file I/O:** `server.js` uses `readFileSync`/`writeFileSync` — concurrent requests can race on `data.json`. Fine for single-user local use; don't deploy to shared environments.
- **`index.html` is 1200+ lines:** All CSS and JS are inline in one file. When editing, search by function name or CSS variable rather than scrolling.
- **`priceNote` is transient:** Accepted in PUT requests but `delete`d from the stored car object before writing — it only appears in the `priceHistory` entry's `note` field.
