-- ============================================================
-- Ash Procurement — Supabase schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- VENDORS
-- ---------------------------------------------------------------
create table if not exists vendors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text default 'Other',
  contact      text,
  email        text,
  phone        text,
  rating       numeric default 4.0,
  status       text not null default 'active' check (status in ('active','inactive')),
  total_spend  numeric not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- STORES
-- ---------------------------------------------------------------
create table if not exists stores (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  contact      text,
  phone        text,
  status       text not null default 'active' check (status in ('active','inactive')),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- PURCHASE HISTORY
-- ---------------------------------------------------------------
create table if not exists purchase_history (
  id            uuid primary key default gen_random_uuid(),
  po_number     text not null,
  vendor        text not null,   -- vendor name (denormalized, matches the app's current model)
  store         text,            -- store name
  item          text not null,
  department    text,
  amount        numeric not null default 0,
  purchase_date date not null,
  status        text not null default 'completed' check (status in ('completed','processing','cancelled')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------------
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null,
  vendor          text not null,
  store           text,
  item            text not null,
  quantity        numeric not null default 1,
  amount          numeric not null default 0,
  order_date      date not null,
  status          text not null default 'placed' check (status in ('placed','shipped','received','cancelled')),
  payment_status  text not null default 'unpaid' check (payment_status in ('paid','partial','unpaid')),
  invoice_url     text,
  proof_url       text,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- CONSUMABLES (store-wise inventory)
-- ---------------------------------------------------------------
create table if not exists consumables (
  id             uuid primary key default gen_random_uuid(),
  store          text not null,
  item           text not null,
  category       text,
  quantity       numeric not null default 0,
  unit           text,
  reorder_level  numeric default 0,
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Helpful indexes for filtering/sorting used by the app
-- ---------------------------------------------------------------
create index if not exists idx_history_date        on purchase_history (purchase_date desc);
create index if not exists idx_history_vendor       on purchase_history (vendor);
create index if not exists idx_history_store        on purchase_history (store);
create index if not exists idx_orders_date          on orders (order_date desc);
create index if not exists idx_orders_vendor        on orders (vendor);
create index if not exists idx_orders_store         on orders (store);
create index if not exists idx_orders_payment       on orders (payment_status);
create index if not exists idx_consumables_store    on consumables (store);

-- ============================================================
-- Row Level Security
-- This app has no login system, so we keep it simple: RLS is on,
-- and a single permissive policy allows the public "anon" key to
-- read/write everything. Good enough for an internal/single-team
-- tracker. If you later add Supabase Auth, tighten these policies
-- (e.g. restrict writes to authenticated users, or to rows the
-- user owns).
-- ============================================================
alter table vendors           enable row level security;
alter table stores             enable row level security;
alter table purchase_history   enable row level security;
alter table orders             enable row level security;
alter table consumables        enable row level security;

create policy "public read/write - vendors"          on vendors           for all using (true) with check (true);
create policy "public read/write - stores"           on stores            for all using (true) with check (true);
create policy "public read/write - purchase_history" on purchase_history  for all using (true) with check (true);
create policy "public read/write - orders"           on orders            for all using (true) with check (true);
create policy "public read/write - consumables"      on consumables       for all using (true) with check (true);
