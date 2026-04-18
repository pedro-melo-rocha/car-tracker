# Atelier design kit

Reference for building new components that match the existing visual language.
**Tokens live in `src/app.css`** — always consume via `var(--token)`, never hardcode hex.

---

## Principles

- **Warm + minimal.** Off-white paper background, white cards, soft rules. No hard blacks.
- **Score-forward.** The score circle is the visual anchor on car surfaces.
- **Pastel status.** Statuses are communicated with subtle filled pills, never strong colors.
- **Subtle motion.** 120–200ms transitions on hover and state; nothing bouncy.
- **Calm typography.** Plus Jakarta Sans. Tight letter-spacing on large numbers and titles (`-0.02em`).

---

## Color tokens

### Surfaces & ink

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#FBFAF7` | Page background (warm off-white) |
| `--card` | `#FFFFFF` | Primary card fill |
| `--card-2` | `#F5F3ED` | Secondary / recessed fill (inputs, soft cards, spec cells) |
| `--rule` | `#ECE8DE` | Borders, dividers |
| `--ink` | `#1C1A17` | Primary text |
| `--ink-soft` | `#6B6760` | Secondary text |
| `--ink-dim` | `#A09B93` | Labels, captions, muted meta |

### Accent

| Token | Hex | Use |
| --- | --- | --- |
| `--accent` | `#2E7D6B` | Primary action (buttons, active chips, focus) |
| `--accent-hover` | `#256756` | Accent hover state |
| `--accent-bg` | `#E3EFEB` | Tinted backgrounds (drop hover, soft accents) |

### Semantic (score tones)

| Token | Fg | Bg | Threshold |
| --- | --- | --- | --- |
| good | `--good` `#3A7A4F` | `--good-bg` `#DEECE1` | score ≥ 70 |
| warn | `--warn` `#B4772A` | `--warn-bg` `#F6EBD6` | score ≥ 50 |
| bad  | `--bad`  `#B04930` | `--bad-bg`  `#F4DDD5` | score < 50 |

Thresholds are set in `scoreClass()` (`src/lib/scoring/index.ts`). `ScoreBadge` also uses these tones directly — keep them aligned.

### Status pastels

Each status gets its own `bg + fg` pair. Keys match `CarStatus` from `src/lib/types.ts`.

| Status | Bg | Fg |
| --- | --- | --- |
| `to-contact` | `--status-to-contact-bg` `#F0EBDD` | `--status-to-contact-fg` `#6B5A2E` |
| `contacted` | `--status-contacted-bg` `#E1E8F0` | `--status-contacted-fg` `#2F5A86` |
| `negotiating` | `--status-negotiating-bg` `#F6EBD6` | `--status-negotiating-fg` `#8A6508` |
| `final-offer` | `--status-final-offer-bg` `#DEECE1` | `--status-final-offer-fg` `#2F6340` |
| `dismissed` | `--status-dismissed-bg` `#EEE3E0` | `--status-dismissed-fg` `#7A4A3F` |

Always go through `<StatusPill status={...} />` — it maps status → tokens.

### Legacy aliases (kept for untouched components)

`--text`, `--text-secondary`, `--text-muted`, `--green`, `--green-bg`, `--yellow`, `--yellow-bg`, `--red`, `--red-bg`, `--blue`, `--blue-bg`, `--bg-card`, `--bg-warm`, `--border`. Prefer the new names in new code.

---

## Radii, shadows, spacing

```
--radius-xs: 4px     tiny pills, bar fills
--radius-sm: 8px     small buttons, soft cards
--radius-md: 10px    inputs, primary buttons, spec cells
--radius:    12px    default card
--radius-lg: 14px    feature card (CarCard)
--radius-xl: 16px    columns, modal
999px                full-pill (chips, status pills, count badges)
```

```
--shadow-sm:  0 1px 2px   rgba(20,17,10,.04)   subtle lift
--shadow:     0 4px 14px -4px rgba(20,17,10,.08)   card hover
--shadow-lg:  0 8px 24px -12px rgba(20,17,10,.18)  raised
--shadow-xl:  0 24px 60px -20px rgba(20,17,10,.25) panels, modals
```

Spacing: no token system — use `4 / 6 / 8 / 10 / 12 / 14 / 16 / 24 / 28 px` multiples. Card padding is usually `12–14px`. Section gaps inside panels are `8–14px`.

## Typography

Family: `var(--font)` = Plus Jakarta Sans. Mono: `var(--mono)` = DM Mono (used only for IDs and price history).

| Role | Size | Weight | Extras |
| --- | --- | --- | --- |
| Panel title | `1.625rem` | 700 | `letter-spacing: -0.02em`, `line-height: 1.2` |
| Price line | `1.75rem` | 700 | `-0.02em` |
| Card price | `1.15rem` (mobile) / `22px` (desktop) | 600 | `-0.02em` |
| Card title | `0.9–0.95rem` | 600 | `-0.01em` |
| Body | `0.85rem` | 500 | |
| Small / meta | `0.76–0.82rem` | 500 | `--ink-soft` |
| Eyebrow / label | `0.68–0.72rem` | 600–700 | uppercase, `letter-spacing: 0.08–0.1em`, `--ink-dim` |

Numbers use `font-variant-numeric: tabular-nums` when they sit in columns.

---

## Animations

```
--ease:      cubic-bezier(0.2, 0.7, 0.2, 1)
--dur-fast:  120ms   hover color/bg transitions
--dur:       200ms   enter/exit, width/opacity
```

Hover states always `transition: all var(--dur-fast) var(--ease)`. Cards lift on hover with `translateY(-1px)` + stronger shadow. Pre-baked keyframes in `app.css`: `fadeUp`, `slideIn`, `slideInUp`, `slideInDown`, `slideOutRight`, `scaleIn`, `spin`, `sheetUp`.

---

## Component patterns

### Card (surface)

```html
<div class="card">
  <!-- content -->
</div>

<style>
.card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  padding: 14px;
  transition: all var(--dur-fast) var(--ease);
}
.card:hover {
  border-color: var(--ink-dim);
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}
</style>
```

### Soft card (recessed)

Used for detail-panel sub-sections (notes, price history, specs).

```html
<div class="soft-card">...</div>

<style>
.soft-card {
  background: var(--card-2);
  border-radius: 10px;
  padding: 12px 14px;
}
</style>
```

### Button — primary

```html
<button type="button" class="btn primary">Action</button>

<style>
.btn {
  padding: 10px 16px;
  border: 0;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease);
}
.btn.primary { background: var(--accent); color: #fff; }
.btn.primary:hover { background: var(--accent-hover); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
```

### Button — ghost / secondary

```css
.btn.secondary {
  background: transparent;
  color: var(--ink-soft);
  border: 1px solid var(--rule);
}
.btn.secondary:hover { background: var(--card-2); color: var(--ink); }

.btn.ghost-danger {
  background: transparent;
  color: var(--bad);
  border: 1px solid var(--rule);
}
.btn.ghost-danger:hover { background: var(--bad-bg); border-color: var(--bad-bg); }
```

### Icon button

26–28px square, transparent, hover fills `--card-2`. Use for row actions.

```css
.icon-btn {
  background: transparent;
  border: 0;
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px;
  color: var(--ink-dim);
  cursor: pointer;
}
.icon-btn:hover { background: var(--card-2); color: var(--ink); }
.icon-btn svg { width: 14px; height: 14px; }
```

SVG convention: `viewBox="0 0 16 16"` or `0 0 24 24`, `fill="none" stroke="currentColor" stroke-width="1.8–2"`.

### Input / textarea

```css
input, textarea, select {
  padding: 10px 14px;
  border: 1px solid var(--rule);
  border-radius: 10px;
  font-size: 0.85rem;
  background: var(--card-2);
  color: var(--ink);
  font-family: inherit;
  transition: border-color var(--dur-fast) var(--ease),
              background var(--dur-fast) var(--ease);
}
input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--card);
}
```

Form label: `0.7rem`, uppercase, `letter-spacing: 0.08em`, `--ink-dim`.

### Chip / pill (selectable)

Used for filter pills, status switcher, etc.

```css
.chip {
  background: var(--card-2);
  border: 1px solid transparent;
  color: var(--ink-soft);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 500;
  transition: all var(--dur-fast) var(--ease);
}
.chip:hover { color: var(--ink); border-color: var(--rule); }
.chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
```

### Count / meta badge

```css
.count {
  background: var(--card);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  color: var(--ink-dim);
}
```

### Score breakdown row

Label + weight + value, then a 4px progress bar spanning full width.

```css
.br-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  column-gap: 10px;
  row-gap: 4px;
}
.br-bar {
  grid-column: 1 / -1;
  height: 4px;
  background: var(--card-2);
  border-radius: 2px;
  position: relative; overflow: hidden;
}
.br-fill { position: absolute; inset: 0 auto 0 0; border-radius: 2px; }
.br-fill.good { background: var(--good); }
.br-fill.warn { background: var(--warn); }
.br-fill.bad  { background: var(--bad); }
```

### Section heading

```css
h3.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
```

---

## Ready-made components

Always prefer reusing these over rebuilding.

### `$components/ui/ScoreBadge.svelte`

Circular score chip with SVG progress ring.

```svelte
<ScoreBadge score={82} size="md" />
```

Props: `score: number`, `size: 'sm' | 'md' | 'lg'` → 36 / 46 / 56 px. Tone is derived from score.

### `$components/ui/StatusPill.svelte`

Pastel pill with leading dot.

```svelte
<StatusPill status={car.status} />
```

Props: `status: CarStatus`.

### `$components/ui/CustomSelect.svelte`

Styled select used for filters and inline status changes.

```svelte
<CustomSelect
  options={[{ value: '', label: 'All' }, ...]}
  value={filter}
  onchange={(v) => (filter = v)}
  placeholder="All"
/>
```

### `$components/ui/CustomCombobox.svelte`

Autocomplete input. Used in `CarForm` for make/engine.

### `$components/car/CarCard.svelte`

Atelier pipeline card. Consumes a `Car`, drag-enabled by default.

```svelte
<CarCard car={car} draggable onopen={openDetail} onedit={openEdit} />
```

### `$components/car/CarRow.svelte` / `CarRowMobile.svelte`

Row views used by the List page — desktop table row + mobile card. Same props (`car`, `onopen`, `onedit`, `ondelete`).

### `$components/car/CarDetailPanel.svelte`

Right-slide 460px panel. Rendered by `+layout.svelte` when `?car=<id>` is in the URL — don't mount directly.

### `$components/car/CarForm.svelte`

Add/Edit form. Rendered via `?edit=new|<id>`.

---

## Utilities worth knowing

- `computeScore(car)` / `computeScoreBreakdown(car)` — `src/lib/scoring/index.ts`
- `locationKm(loc)` — distance (km) from Viana do Castelo, or `null`
- `timeAgo(iso)` — `src/lib/staleness.ts`, returns `"just now"`, `"5m ago"`, `"2d ago"`
- `toast.success / toast.error` — `$lib/stores/ui`
- `confirmDialog({ title, message, confirmLabel })` — returns `Promise<boolean>`
- `apiFetch(path, init)` — `$lib/api`, auto-injects `x-api-secret`

---

## Adding a new component — checklist

1. Put it under `src/components/<domain>/` (`car/`, `ui/`, `layout/`).
2. `<script lang="ts">`, Svelte 5 runes (`$props`, `$state`, `$derived`, `$effect`). No Svelte 4 stores-as-props.
3. Scoped `<style>` block. Consume `var(--token)` only — no hex, no named colors.
4. Use `transition: all var(--dur-fast) var(--ease)` on any hover/active state.
5. Radius: 10 for small, 12 default, 14 for cards, 16 for columns/modals.
6. If it shows a car score → `ScoreBadge`. If it shows status → `StatusPill`. If it picks from a list → `CustomSelect` / `CustomCombobox`.
7. Run `npm run check`. Fix the errors, not the warnings.
