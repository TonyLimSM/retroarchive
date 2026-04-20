-- =============================================================================
-- RetroGames schema
-- =============================================================================
-- Your collection of retro games with purchase/market pricing.
-- Run this in the Supabase SQL editor, or via `supabase db push` once the CLI
-- is linked to your project.
-- =============================================================================

-- Fixed, small sets of values → use Postgres ENUMs.
-- (Alternative would be CHECK constraints on text columns; enums are stricter
--  but harder to extend later. See the decision notes in the README.)
-- MD ≠ Genesis and SFC ≠ SNES at the cartridge level — different shells,
-- different buyer pools, different prices. Tracked separately on purpose.
create type console_type as enum ('PS2', 'MD', 'Genesis', 'Saturn', 'SFC', 'SNES');
create type condition_type as enum ('Loose', 'CIB', 'New');

-- Region matters for retro carts: JP buyers pay premium for SFC/Saturn,
-- PAL collectors prize boxed PAL exclusives, etc. Tracking region also
-- drives the channel-routing decision (JP → Yahoo Auctions JP, etc.).
create type region_type as enum ('JP', 'US', 'EU', 'Other');

create table retro_games (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,

  title        text not null,
  console      console_type not null,
  condition    condition_type not null default 'CIB',
  region       region_type not null default 'JP',

  -- Prices stored as numeric(10,2): exact decimals up to 99,999,999.99.
  -- Good default for money; works across currencies with/without subunits.
  current_market_price  numeric(10,2) not null check (current_market_price >= 0),
  purchase_price        numeric(10,2) not null check (purchase_price        >= 0),

  -- Free-form notes: damage, manual missing, save battery dead, etc.
  notes        text,

  -- Storage object paths for photos, e.g. ['<owner>/<game>/front.jpg', ...].
  -- Build the public URL with supabase.storage.from('retro-games').getPublicUrl(path).
  photos       text[] not null default '{}',

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Common lookup: "show me all my PS2 games" or "all Loose copies".
create index retro_games_owner_console_idx   on retro_games (owner_id, console);
create index retro_games_owner_condition_idx on retro_games (owner_id, condition);


-- =============================================================================
-- Row-Level Security
-- =============================================================================
-- Owners (and only owners) can read and write their own rows.
-- `using` gates which rows a query can see/update/delete.
-- `with check` gates what new/updated rows are allowed to look like —
--   this prevents a user from inserting a row with someone else's owner_id.

alter table retro_games enable row level security;

create policy "owners manage their games"
  on retro_games for all
  to authenticated
  using      (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger retro_games_set_updated_at
  before update on retro_games
  for each row execute function set_updated_at();


-- =============================================================================
-- Photo storage bucket
-- =============================================================================
-- Public bucket so the app can render <img src=...> directly without signed
-- URLs. Listings on eBay etc. will need publicly accessible image URLs anyway.
-- Path convention: <owner_id>/<game_id>/<filename>.
-- The path-prefix RLS below ensures users can only write under their own folder.

insert into storage.buckets (id, name, public)
  values ('retro-games', 'retro-games', true)
  on conflict (id) do nothing;

create policy "owners upload to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'retro-games'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update their photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'retro-games'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete their photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'retro-games'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public bucket → SELECT is unrestricted on purpose (anyone with URL can view).
