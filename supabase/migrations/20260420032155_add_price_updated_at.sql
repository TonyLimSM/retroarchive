-- Tracks when the current_market_price was last refreshed from PriceCharting.
-- Null = never fetched. Used to gate the background "refresh stale prices"
-- job so we don't hammer PriceCharting (self-imposed rate limit: once per
-- game per 7 days).
alter table retro_games add column if not exists price_updated_at timestamptz;
