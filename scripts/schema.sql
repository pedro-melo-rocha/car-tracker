-- Run this in Supabase SQL Editor once, to create the cars table.
-- For existing databases, run scripts/migrations/*.sql in order instead.

create table if not exists cars (
  id             text primary key,
  "addedAt"      timestamptz not null default now(),
  url            text,
  title          text,
  make           text,
  model          text,
  year           int check (year is null or (year between 1950 and 2100)),
  km             int check (km is null or km >= 0),
  price          int check (price is null or price >= 0),
  fuel           text,
  engine         text,
  power          int check (power is null or power >= 0),
  source         text,
  status         text not null default 'to-contact'
                 check (status in (
                   'to-contact', 'contacted', 'inactive',
                   'negotiating', 'rejected', 'bought'
                 )),
  location       text,
  notes          text,
  "contactedAt"  timestamptz,
  "priceHistory" jsonb not null default '[]'::jsonb,
  version        int not null default 1
);

create index if not exists cars_status_idx on cars (status);
create index if not exists cars_added_at_idx on cars ("addedAt" desc);

-- RLS on, no policies = no client-side access.
-- Serverless functions use the service role key which bypasses RLS.
alter table cars enable row level security;
