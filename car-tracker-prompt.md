# Car Tracker — Claude Code Prompt

Build a local car search tracker app. Plain HTML/JS frontend + Node.js/Express backend + `data.json` for persistence. No framework, no database.

## Stack

- `server.js` — Express server, serves `index.html` statically and exposes a REST API
- `index.html` — single file, all CSS and JS inline
- `data.json` — persists all car data
- `package.json` with a `start` script

---

## Data Model

```json
{
  "id": "timestamp string",
  "addedAt": "ISO date",
  "url": "listing URL",
  "title": "e.g. Renault Clio III 1.5 dCi 2008",
  "make": "",
  "model": "",
  "year": 2008,
  "km": 120000,
  "price": 5500,
  "fuel": "Diesel | Gasolina",
  "source": "StandVirtual | AutoScout24 | OLX | Facebook Marketplace | PiscaPisca | Other",
  "status": "to-contact | contacted | visit-scheduled | visited | negotiating | rejected | bought",
  "notes": "free text",
  "priceHistory": [{ "date": "ISO", "price": 5500, "note": "Initial price" }]
}
```

---

## API Endpoints

- `GET /api/cars` — list all
- `POST /api/cars` — create (auto-generates id, addedAt, initial priceHistory entry)
- `PUT /api/cars/:id` — update (if price changed, append to priceHistory; accept optional `priceNote` field for the log entry, then discard it from the main object)
- `DELETE /api/cars/:id` — delete

---

## Car Score

Add a `computeScore(car)` function used across all views. Returns a score from 0–100.

| Factor | Logic |
|--------|-------|
| **Km** | 0 km = 100pts, 200 000 km = 0pts. Linear. Cap at 0. |
| **Price** | €0 = 100pts, €10 000 = 0pts. Linear. Cap at 0. |
| **Year** | 2015+ = 100pts, 2000 = 0pts. Linear between those. |
| **Status bonus** | `visited` = +5, `negotiating` = +10 (reward engagement) |

Weights: Km 35%, Price 35%, Year 20%, Status 10%. Round to nearest integer.

Display the score as a coloured badge on every car card and in the detail panel:
- 75–100 → green
- 50–74 → yellow/orange
- 0–49 → red

---

## UI — Three Views

Three tabs in the sticky header nav: **Pipeline** | **List** | **Compare**

---

### 1. Pipeline View (default)

- Kanban-style columns, one per status, in this order: To Contact → Contacted → Visit Scheduled → Visited → Negotiating → Rejected → Bought
- Each column shows a count badge and a list of car cards
- Each car card shows: source tag, title, year chip, km chip, fuel chip, price chip (green), score badge, first 80 chars of notes, Edit button, Compare toggle button
- Filter bar above pipeline: text search (searches title/make/model/notes), fuel dropdown, source dropdown
- Clicking a card (not a button) opens a detail side panel sliding in from the right

---

### 2. List View

- Responsive grid of car cards (same card style as pipeline)
- Filter bar: text search, fuel toggle (All / Diesel / Gasolina), source dropdown, status dropdown, make dropdown (populated dynamically from existing cars)
- Sort controls: Price ↑↓, Km ↑↓, Year ↑↓, Score ↑↓, Date Added ↑↓
- Active sort button is highlighted; clicking the same sort again toggles asc/desc
- Cards show all fields plus the score badge
- Clicking a card opens the detail side panel

---

### 3. Compare View

- Shows all cars as toggle buttons at the top (max 5 selectable)
- Renders a comparison table: rows = fields, columns = selected cars
- Fields: Status, Source, Year, Km, Price, Fuel, Score, URL (clickable link), Notes, Date Added
- For numeric fields (Km, Price, Score), highlight best value green and worst value red

---

## Detail Side Panel

Slides in from the right, overlay background closes it on click.

- Car title, status badge, source tag
- Score badge (prominent)
- 2-column grid of detail chips: Year, Km, Fuel, Price
- "Open Listing" button linking to URL (if present)
- Notes section (pre-wrap text)
- Price history list (each entry: price in green, date, optional note)
- Edit and Delete buttons at bottom
- Closes on overlay click or ✕ button

---

## Add/Edit Modal

Centered overlay.

- Fields: URL, Title, Make, Model, Year, Km, Price, Fuel (select), Source (select), Status (select), Notes (textarea)
- When editing and price changes, show an extra "Reason for price change" input that gets saved as the priceHistory note
- Closes on overlay click or Cancel

---

## Design

- Dark theme, professional feel
- CSS variables for all colors
- Sticky header with app title and nav buttons
- No external dependencies beyond Express
