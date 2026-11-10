-- 005: listing/seller signals used by the suspicion check (and later the score).
-- Filled by the importers where the listing exposes them; all optional.

alter table cars add column if not exists "sellerType"     text;          -- 'private' | 'dealer'
alter table cars add column if not exists "sellerSince"    int;           -- year the seller account was created
alter table cars add column if not exists "listedAt"       timestamptz;   -- when the listing first went up
alter table cars add column if not exists gearbox          text;          -- 'Manual' | 'Automática'
alter table cars add column if not exists owners           int check (owners is null or owners >= 0);
alter table cars add column if not exists "warrantyMonths" int check ("warrantyMonths" is null or "warrantyMonths" >= 0);
alter table cars add column if not exists imported         boolean;
alter table cars add column if not exists "photoCount"     int check ("photoCount" is null or "photoCount" >= 0);
alter table cars add column if not exists description      text;
