-- Wardrobe TMA — core schema
-- Run in order: 0001_init.sql, then 0002_storage.sql

-- ---------- ENUM ----------
create type public.wardrobe_category as enum ('headwear', 'tops', 'bottoms', 'shoes');

-- ---------- PROFILES ----------
-- One row per Telegram user. `id` IS the Supabase auth uid (auth.users.id),
-- created via an anonymous sign-in that the auth edge function (step 4)
-- performs after validating Telegram initData. tg_user_id is what links
-- a returning Telegram session back to the same row.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tg_user_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per Telegram user, keyed by their Supabase auth uid.';

-- ---------- ITEMS ----------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  category public.wardrobe_category not null,
  name text not null default 'Новая вещь',
  -- Path inside the "wardrobe-photos" storage bucket, e.g. "{owner}/{item id}.png".
  -- Nullable: an item can exist before its photo finishes uploading.
  image_path text,
  created_at timestamptz not null default now()
);

create index items_owner_idx on public.items (owner);
create index items_owner_category_idx on public.items (owner, category);

-- ---------- LOOKS ----------
create table public.looks (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index looks_owner_idx on public.looks (owner);

-- ---------- LOOK_ITEMS (join table) ----------
-- `category` is redundant with items.category but kept here so a look's
-- collage can be rendered with a single query (no join needed) and so the
-- category survives even if items.category is ever changed later.
-- `position` preserves manual ordering within a category (mainly "tops",
-- the one category that allows multiple selected items).
create table public.look_items (
  look_id uuid not null references public.looks (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  category public.wardrobe_category not null,
  position smallint not null default 0,
  primary key (look_id, item_id)
);

create index look_items_look_idx on public.look_items (look_id);
create index look_items_item_idx on public.look_items (item_id);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.looks enable row level security;
alter table public.look_items enable row level security;

-- profiles: a user can read/update only their own row.
-- Row creation happens via the service-role auth edge function (step 4),
-- which bypasses RLS, so no insert policy is granted to `authenticated`.
create policy "profiles: select own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- items: full CRUD, scoped to rows the caller owns.
create policy "items: select own" on public.items
  for select to authenticated
  using (owner = auth.uid());

create policy "items: insert own" on public.items
  for insert to authenticated
  with check (owner = auth.uid());

create policy "items: update own" on public.items
  for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

create policy "items: delete own" on public.items
  for delete to authenticated
  using (owner = auth.uid());

-- looks: same pattern as items.
create policy "looks: select own" on public.looks
  for select to authenticated
  using (owner = auth.uid());

create policy "looks: insert own" on public.looks
  for insert to authenticated
  with check (owner = auth.uid());

create policy "looks: update own" on public.looks
  for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

create policy "looks: delete own" on public.looks
  for delete to authenticated
  using (owner = auth.uid());

-- look_items: ownership is derived through the parent look (no owner column
-- of its own), so every policy joins back to public.looks.
create policy "look_items: select via look" on public.look_items
  for select to authenticated
  using (exists (
    select 1 from public.looks l where l.id = look_id and l.owner = auth.uid()
  ));

create policy "look_items: insert via look" on public.look_items
  for insert to authenticated
  with check (exists (
    select 1 from public.looks l where l.id = look_id and l.owner = auth.uid()
  ));

create policy "look_items: update via look" on public.look_items
  for update to authenticated
  using (exists (
    select 1 from public.looks l where l.id = look_id and l.owner = auth.uid()
  ))
  with check (exists (
    select 1 from public.looks l where l.id = look_id and l.owner = auth.uid()
  ));

create policy "look_items: delete via look" on public.look_items
  for delete to authenticated
  using (exists (
    select 1 from public.looks l where l.id = look_id and l.owner = auth.uid()
  ));
