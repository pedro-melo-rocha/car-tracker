-- Migration 001: add constraints, indexes, and optimistic-locking version column.
-- Safe to re-run. Execute in Supabase SQL Editor.

-- 1. Normalize any legacy status values before we add the check constraint.
update cars set status = 'inactive'
  where status in ('sem-resposta', 'inativo');

-- 2. Add optimistic-locking version column.
alter table cars
  add column if not exists version int not null default 1;

-- 3. CHECK constraints (wrapped in DO blocks so re-runs don't error).
do $$ begin
  alter table cars add constraint cars_year_chk
    check (year is null or (year between 1950 and 2100));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table cars add constraint cars_km_chk
    check (km is null or km >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table cars add constraint cars_price_chk
    check (price is null or price >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table cars add constraint cars_power_chk
    check (power is null or power >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table cars add constraint cars_status_chk
    check (status in (
      'to-contact', 'contacted', 'inactive',
      'negotiating', 'rejected', 'bought'
    ));
exception when duplicate_object then null; end $$;

-- 4. Indexes.
create index if not exists cars_status_idx on cars (status);
create index if not exists cars_added_at_idx on cars ("addedAt" desc);
