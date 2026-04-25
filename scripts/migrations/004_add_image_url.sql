-- 004: add imageUrl column to cars
-- External image URL from the listing site (StandVirtual, AutoScout24, OLX, etc.).
-- Not hosted by us; just a pointer for display.

alter table cars add column if not exists "imageUrl" text;
