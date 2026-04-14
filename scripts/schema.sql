-- Run this in Supabase SQL Editor once, to create the cars table.

create table if not exists cars (
  id             text primary key,
  "addedAt"      timestamptz not null default now(),
  url            text,
  title          text,
  make           text,
  model          text,
  year           int,
  km             int,
  price          int,
  fuel           text,
  engine         text,
  power          int,
  source         text,
  status         text not null default 'to-contact',
  location       text,
  notes          text,
  "contactedAt"  timestamptz,
  "priceHistory" jsonb not null default '[]'::jsonb
);

-- RLS on, no policies = no client-side access.
-- Serverless functions use the service role key which bypasses RLS.
alter table cars enable row level security;
