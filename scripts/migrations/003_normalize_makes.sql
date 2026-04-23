-- Migration 003: normalise common make-name variants to their canonical form.
-- Canonical forms match DATALIST_MAKES in src/lib/constants.ts.
-- Safe to re-run (idempotent — no-op after the first run).

-- VW → Volkswagen (also catches casing variants like "vw", "VOLKSWAGEN").
update cars set make = 'Volkswagen'
  where lower(make) in ('vw', 'volkswagen')
    and make <> 'Volkswagen';

-- Mercedes / Mercedes Benz → Mercedes-Benz.
update cars set make = 'Mercedes-Benz'
  where lower(make) in ('mercedes', 'mercedes-benz', 'mercedes benz')
    and make <> 'Mercedes-Benz';

-- Citroen → Citroën (the ë is the canonical form).
update cars set make = 'Citroën'
  where lower(make) in ('citroen', 'citroën')
    and make <> 'Citroën';
