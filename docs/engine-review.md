# Engine delta review

Working doc for reviewing `ENGINE_PROFILES` deltas in `src/lib/constants.ts`. Pedro fills in **Proposal** and **Sources** engine-by-engine; once an engine is agreed, the delta changes land in a separate commit.

Columns:

- **Engine** — the regex label as shown on `/docs`.
- **Fuel** — Diesel / Gasolina / any.
- **Current** — delta currently in `ENGINE_PROFILES`.
- **Proposal** — new delta (or "keep"), with year-split notes if needed.
- **Rationale** — one-liner justifying the proposal.
- **Sources** — forum threads, reliability surveys, repair-cost data.

## Priority queue (from the 2026-04 external critique)

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 1.2 TDI (VW 3-cyl) | Diesel | -4 | | Critique: "1.2 TDI should be worse than 1.4 TDI". Investigate whether -4 under-penalises this block. | |
| 1.4 TDI (PD / EA189 CR) | Diesel | -7 | | Needs generation split — PD variants have a better field reputation than the Dieselgate-era CR. Is -7 too harsh across the board? | |
| 1.4 HDi / 1.4 TDCi (PSA DV4) | Diesel | -10 | | Critique listed as viable ("em alternativa um 1.4 HDi"). Is -10 too harsh? | |
| 1.5 dCi (Renault K9K) | Diesel | -5 | | Critique listed as viable ("1.5 DCI"). Needs year split — late K9K units are far better than early ones. | |
| 1.4 CRDi (Hyundai/Kia D4FC) | Diesel | +3 | | Critique listed as viable ("1.4 crdi"). Sanity-check that +3 isn't too generous. | |
| 1.4 D-4D (Toyota) | Diesel | +18 | | Critique listed as viable ("1.4 D4D"). +18 is already the top delta — keep? | |

## Open policy questions

- **Diesel <1.4L blanket penalty.** The critique says "carros a gasóleo só 1.4 para cima". Worth adding a `diesel && displacement < 1.4` rule, or keep per-engine? (Per-engine is more precise; blanket rule is more defensible.)
- **Year splits.** Several entries (1.4 TDI, 1.5 dCi, 1.6 HDi) would benefit from a `yearMin` / `yearMax` split the way 1.2 TSI and 1.6 TDI already do.

## Sweep backlog (lower priority)

All 44 engines will eventually be re-reviewed. For now, focus on the priority queue above; extend this table only when you hit a surprising score in the app.
