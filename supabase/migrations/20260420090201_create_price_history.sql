-- Price history snapshots — one row per price refresh per game.
-- Used for sparklines on the detail page and trend analysis on the dashboard.
--
-- Volume estimate: 1000 games × 1 refresh/week × 52 weeks = 52k rows/year.
-- Each row ~80 bytes → ~4 MB/year. Trivially fits Supabase free tier.

create table price_history (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references retro_games(id) on delete cascade,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  price       numeric(10,2) not null check (price >= 0),
  condition   condition_type not null,
  -- e.g. 'pricecharting', 'ebay', 'manual', so we can filter/trace later
  source      text not null default 'pricecharting',
  recorded_at timestamptz not null default now()
);

-- Fast per-game time-series lookup: "give me the last 6 months for game X".
create index price_history_game_time_idx
  on price_history (game_id, recorded_at desc);

-- Owner-scoped access — same pattern as retro_games.
alter table price_history enable row level security;

create policy "owners see their price history"
  on price_history for all
  to authenticated
  using      (owner_id = auth.uid())
  with check (owner_id = auth.uid());
