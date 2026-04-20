# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project purpose

Inventory, pricing, and listing automation for a personal collection of ~1000 rare retro game cartridges (PS2, MD, Genesis, Saturn, SFC, SNES). The end goal is to liquidate the collection with maximum automation AND no paid APIs. This cost constraint is load-bearing — do not suggest Shopify, Vendoo, List Perfectly, Keepa, Terapeak Pro, or any paid-tier pricing service. Default to Supabase free tier, Vercel hobby, PriceCharting free tier, eBay Trading API (free), and Yahoo Auctions Japan.

## Commands

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build
npm run lint        # ESLint
npx tsc --noEmit    # typecheck — no npm script for this yet
```

No test runner is configured.

Windows bash/Git Bash shell. Work from `retro-games-app/` (the inner project dir), not the outer `2026_Tony_WebExperiment/`. Env vars are read at startup only — restart the dev server after editing `.env.local`.

## Next.js version quirks

Beyond what AGENTS.md warns about, specific API changes that trip up older-Next.js muscle memory:

- **`middleware.ts` → `proxy.ts`.** Exports `proxy`. Lives at `src/proxy.ts`. Identical behavior otherwise.
- **Dynamic route `params` is a Promise.** `export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; ... }`.
- **`cookies()` from `next/headers` is async.** Already applied in `src/lib/supabase/server.ts`.

When uncertain, read `node_modules/next/dist/docs/01-app/...` — the bundled docs are authoritative for this project's exact Next.js version.

## Demo mode — the key architecture trick

The app runs in two modes, switched by the presence of `NEXT_PUBLIC_SUPABASE_URL`:

- **Demo mode** (no env var): the data layer returns a seeded array of famous-rare CIB cartridges. No backend needed. The amber banner in the header advertises this.
- **Live mode** (env var set): the data layer calls Supabase. RLS scopes every row to the authenticated user.

This conditional is load-bearing across three files:

- `src/lib/data/games.ts` — exports `isDemoMode`; `listGames`/`getGame` branch on it.
- `src/proxy.ts` — short-circuits to `NextResponse.next()` in demo mode so it doesn't try to construct a Supabase client with undefined URL.
- `src/lib/supabase/auth.ts` — `getCurrentUser()` returns `null` in demo mode.

**Pages must never import `@/lib/supabase/server` or `@/lib/supabase/client` directly to fetch game data.** Route all game reads through `src/lib/data/games.ts` so demo mode keeps working. Auth-state checks (`getCurrentUser`) are fine to call directly from pages.

## Data layer shape

```
Server Component page
    └─ await listGames() / getGame(id) from src/lib/data/games.ts
           ├─ if !NEXT_PUBLIC_SUPABASE_URL → MOCK_GAMES  (src/lib/data/mock-games.ts)
           └─ else                         → supabase.from('retro_games')...
```

The seed in `mock-games.ts` is also used by `src/app/seed/actions.ts` to populate a newly-created Supabase account with demo data on first run.

## Schema source-of-truth

Two files must be kept in sync by hand until the Supabase CLI is linked:

- **Schema:** `supabase/migrations/20260417000000_create_retro_games.sql` (hand-written SQL, not auto-applied).
- **TS types:** `src/lib/supabase/database.types.ts` (hand-written, wired into both supabase clients via generics).

The migration is copy-pasted into the Supabase SQL Editor dashboard — there is no `supabase db push` wiring yet. Once the CLI is linked:

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## Row-Level Security — must-know behaviors

- Every `retro_games` row is scoped to `owner_id = auth.uid()` via a single `for all` policy.
- **RLS checks but does not fill.** INSERTs must set `owner_id` explicitly (see `src/app/seed/actions.ts`). Omitting it fails the NOT NULL constraint before RLS even runs.
- **Storage bucket `retro-games` uses the path convention `<owner_id>/<game_id>/<filename>`.** The storage RLS policies match on `storage.foldername(name)[1] = auth.uid()::text`. The uploader in `src/app/games/[id]/photos/PhotoUploader.tsx` enforces this path shape client-side; changing the shape breaks the RLS check.
- Photos upload browser-direct to Storage (avoiding the server action body-size limit), then a separate `attachPhotos` server action appends the path strings to the game row.

## Build state

Phased delivery toward the liquidation goal:

1. **Inventory + photos** — mostly built. Schema, CSV import skeleton, photo uploader, demo UI, auth, and seed-demo-data flow all wired. Outstanding: user must implement `mapRowToGame` in `src/app/(admin)/import/mapping.ts` against their real CSV's column names.
2. **Pricing intelligence** — not started. PriceCharting free-tier integration planned.
3. **Listing automation** — not started. eBay Trading API for Western markets, Yahoo Auctions Japan for premium SFC/Saturn/MD-JP.
4. **Sales pipeline** — not started.
