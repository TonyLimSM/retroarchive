-- Cover art URL (publisher/Wikipedia image) vs. the existing `photos` column
-- which holds user-uploaded photos of their actual copy.
--   cover_url = "what the game looks like" (identification, browsing)
--   photos    = "what MY copy looks like" (proof of condition for listings)
alter table retro_games add column if not exists cover_url text;
