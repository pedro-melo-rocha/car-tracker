# Car Tracker

A local-only car search tracker for browsing used car listings in Portugal. Built with a no-framework stack: plain HTML/JS frontend, Express backend, and file-based JSON persistence.

## Getting Started

```bash
npm install
npm start
```

The app runs at [http://localhost:3000](http://localhost:3000). Set the `PORT` environment variable to use a different port.

## Features

- **Pipeline view** — Kanban board organized by status
- **List view** — Sortable and filterable grid of all listings
- **Compare view** — Side-by-side comparison table
- **Detail panel** — Slide-out panel with full car details
- **Price tracking** — Automatic price history when prices change
- **Car scoring** — 0-100 score based on km, price, year, and status
- **Auto-staleness** — Cars in "contacted" status auto-transition to "sem-resposta" after 3 days, then "inativo" after 5 days

## Status Pipeline

`to-contact` → `contacted` → `visit-scheduled` → `visited` → `negotiating` → `rejected` / `bought`

Auto-generated statuses: `sem-resposta`, `inativo`

## Supported Sources

StandVirtual, AutoScout24, OLX, Facebook Marketplace, PiscaPisca, Other

## Tech Stack

- **Frontend:** Single `index.html` with inline CSS and JS (no build step, no dependencies)
- **Backend:** Node.js + Express
- **Storage:** `data.json` (file-based, single-user)

## Project Structure

```
index.html    — Single-file SPA (all UI, styles, and client logic)
server.js     — Express REST API with CRUD endpoints (/api/cars)
data.json     — Persistent storage (array of car objects)
```

## Notes

- Designed for single-user local use only (synchronous file I/O)
- Dark theme with CSS variables
- Portuguese-market context: prices in euros, Portuguese listing sources
