# Vehicle Enhancements Design

**Date:** 2026-04-13  
**Status:** Approved

---

## Context

The car-organizer app currently requires all vehicle fields to be filled manually, has no drag-and-drop in the pipeline, and doesn't show the listing URL in the list view. This spec covers improvements across two sessions: reducing friction when adding vehicles, navigating the pipeline, and introducing automatic follow-up tracking via staleness states.

---

## Features

### 1. URL Auto-Inference on Vehicle Add

**Goal:** When the user pastes a listing URL, auto-fill Source, Make, and Model where detectable.

**Trigger:** `input` or `blur` event on the URL field in the add/edit modal.

**Logic (frontend, no fetch):**

- **Source detection** — map URL hostname to the Source enum:
  - `standvirtual.com` → "StandVirtual"
  - `autoscout24.pt` → "AutoScout24"
  - `olx.pt` → "OLX"
  - `facebook.com` → "Facebook Marketplace"
  - `piscapisca.pt` → "PiscaPisca"

- **Make/Model detection** — regex on `pathname`:
  - StandVirtual pattern: `/anuncios/<make>-<model>-*/` → extract first two slug segments
  - AutoScout24 pattern: `/pt/carros/<make>/<model>/` → extract path segments after `/carros/`
  - PiscaPisca: best-effort on path slug (e.g., `/volkswagen-polo/`)
  - General fallback: split first path segment on `-`, capitalize first word as Make, second as Model

- **Non-destructive:** Only fills fields that are currently empty. Never overwrites user-entered values.

- **Visual feedback:** Inferred fields get a subtle left-border accent (`border-left: 2px solid var(--accent)`) that disappears on user focus.

---

### 2. Vehicle Location Field

**Goal:** Store the geographic location where a car is listed (e.g., "Lisboa", "Porto").

**Data model:** New optional string field `location` on the car object.

**Backend (`server.js`):**
- `POST /api/cars` and `PUT /api/cars/:id` — include `location: req.body.location || ''`

**Frontend:**
- **Modal form:** New text input "Localização" between Source and Status fields.
- **Detail panel:** Show "Local" in the 2-column detail grid.
- **Pipeline card:** Show `📍 <location>` below the price line, only if non-empty.
- **List table:** Add "Local" column after "Source" column.

---

### 3. URL Link in List View Actions Column

**Goal:** Quick access to the listing URL from the table without opening the detail panel.

**Implementation:**
- All action buttons in the "Ações" column are icon-only SVG buttons (no text labels): 🔗 Edit Delete.
- 🔗 only rendered if `car.url` is non-empty; opens `target="_blank" rel="noopener noreferrer"`.

---

### 4. Pipeline Drag-and-Drop

**Goal:** Move car cards between status columns by dragging.

**Implementation (HTML5 native Drag and Drop API):**
- Each pipeline card gets `draggable="true"` and `dragstart` stores `car.id` in `event.dataTransfer`.
- Each `.pipeline-col` gets `dragover` (calls `event.preventDefault()`) and `drop` handlers.
- On `drop`: extract `id`, read column's `data-status`, call `updateCar(id, { status: newStatus })`.
- **Visual feedback on dragover:** target column gets class `drag-over` → CSS adds `outline: 2px dashed var(--accent)` and `background: rgba(12, 110, 93, 0.05)`.
- **No workflow restrictions:** any card can be dropped into any column.
- **Touch:** no touch support in this iteration.

---

### 5. Staleness States: `sem-resposta` and `inativo`

**Goal:** Automatically track when a contacted seller stops responding.

#### Workflow (7 states — `visit-scheduled` and `visited` removed entirely)

```
to-contact → contacted → sem-resposta → inativo
                ↓
           negotiating → rejected
                       → bought
```

#### Status colors (pipeline column borders)
| Status | Color |
|--------|-------|
| `to-contact` | gray |
| `contacted` | blue |
| `sem-resposta` | amber/orange |
| `inativo` | dark red |
| `negotiating` | orange |
| `rejected` | red |
| `bought` | green |

#### `contactedAt` field
- Set automatically on the server when status is set to `"contacted"`.
- Stored as ISO string on the car object.
- Never cleared — preserved as historical record.

#### Auto-transition logic (runs on every `GET /api/cars` in `server.js`)
1. For each car where `status === "contacted"`:
   - If `contactedAt + 3 days < now` → set `status = "sem-resposta"`
2. For each car where `status === "sem-resposta"`:
   - If `contactedAt + 5 days < now` → set `status = "inativo"` (i.e., 2 days after entering sem-resposta)
3. If any car was updated, write `data.json` before responding.

#### Status badge color in list view
- `sem-resposta` → amber badge
- `inativo` → dark gray/muted badge
- All other statuses → their standard pipeline color

---

### 6. Make/Model Comboboxes

**Goal:** Speed up entry with suggestions while still allowing free text.

**Implementation:** `<input list="...">` + `<datalist>` (native HTML5, no JS library).

- **Make datalist** — static list of common Portuguese market brands:
  Volkswagen, Peugeot, Renault, Opel, Ford, Toyota, Seat, Skoda, Fiat, BMW, Mercedes-Benz, Audi, Hyundai, Kia, Nissan, Citroën, Honda, Mazda, Volvo, Dacia, Mitsubishi, Suzuki

- **Model datalist** — dynamically populated from models already in `data.json` for the currently selected make. Updates on make field `change` event.

- User can type any value not in the list; no validation restriction.

---

### 7. Add Vehicle Button Styling Fix

Investigate and fix the visual inconsistency of the "Add Vehicle" / "+" button. Align with the existing design system (accent color `#0C6E5D`, correct padding, consistent border-radius, proper z-index/positioning).

---

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | All frontend changes: form fields, card rendering, list columns, DnD events, inference function, comboboxes, icon actions, button fix |
| `server.js` | Add `location`, `contactedAt` to handlers; add staleness auto-transition on GET |
| `data.json` | No migration — new fields are optional; existing cars remain valid |

---

## Verification

1. **URL inference:** Paste a StandVirtual URL → Source, Make, Model auto-fill without overwriting existing values.
2. **Location:** Add a car with "Lisboa" → visible in form, detail panel, pipeline card, and list table.
3. **URL in list:** Car with URL shows link icon; car without URL doesn't.
4. **Drag-and-drop:** Drag card to another column → status updates; column highlights on dragover.
5. **Staleness:** Manually set a car's `contactedAt` to 4 days ago → on next load, status should be `sem-resposta`; set to 6 days ago → `inativo`.
6. **Removed states:** `visit-scheduled` and `visited` don't appear in modal status dropdown or pipeline.
7. **Comboboxes:** Typing "Volks" in Make shows "Volkswagen" suggestion; typing unknown make works fine.
8. **Button:** Add Vehicle button looks consistent with the rest of the UI.
