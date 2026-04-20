"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPrices,
  findPricechartingUrl,
  pricesForCondition,
} from "@/lib/pricecharting";

const STALE_AFTER_DAYS = 7;
const DELAY_BETWEEN_FETCHES_MS = 250;

export type BulkRefreshResult = {
  attempted: number;
  succeeded: number;
  skipped: number;
  errors: { title: string; reason: string }[];
};

/**
 * Refresh current_market_price for every game whose price has never been
 * fetched OR was fetched more than 7 days ago.
 *
 * Sequential by design — we don't want to slam PriceCharting with 50 parallel
 * requests. For large collections (>100 games) this will take a while; the
 * client component shows a running count so the UI doesn't feel frozen.
 * At ~1000 items this becomes a real background-job problem that we'll
 * address by moving to pg_cron / Edge Functions.
 */
export async function refreshAllStalePrices(): Promise<BulkRefreshResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      attempted: 0, succeeded: 0, skipped: 0,
      errors: [{ title: "(auth)", reason: "Not signed in" }],
    };
  }

  const cutoff = new Date(
    Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: games, error: listError } = await supabase
    .from("retro_games")
    .select("id, title, console, region, condition, current_market_price, price_updated_at")
    .or(`price_updated_at.is.null,price_updated_at.lt.${cutoff}`)
    .order("created_at", { ascending: true });
  if (listError) {
    return {
      attempted: 0, succeeded: 0, skipped: 0,
      errors: [{ title: "(query)", reason: listError.message }],
    };
  }
  if (!games || games.length === 0) {
    return { attempted: 0, succeeded: 0, skipped: 0, errors: [] };
  }

  const result: BulkRefreshResult = {
    attempted: games.length, succeeded: 0, skipped: 0, errors: [],
  };

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    try {
      const url = await findPricechartingUrl(g.title, g.console, g.region);
      if (!url) {
        result.skipped += 1;
        result.errors.push({ title: g.title, reason: "No PriceCharting match" });
        continue;
      }
      const prices = await fetchPrices(url);
      if (!prices) {
        result.skipped += 1;
        result.errors.push({ title: g.title, reason: "Page fetch failed" });
        continue;
      }
      const picked = pricesForCondition(prices, g.condition);
      if (picked === null) {
        result.skipped += 1;
        result.errors.push({
          title: g.title,
          reason: `No ${g.condition} price listed`,
        });
        continue;
      }

      const now = new Date().toISOString();
      const [updateResult] = await Promise.all([
        supabase
          .from("retro_games")
          .update({ current_market_price: picked, price_updated_at: now })
          .eq("id", g.id),
        supabase.from("price_history").insert({
          game_id: g.id,
          owner_id: user.id,
          price: picked,
          condition: g.condition,
          source: "pricecharting",
          recorded_at: now,
        }),
      ]);
      if (updateResult.error) {
        result.errors.push({ title: g.title, reason: updateResult.error.message });
        continue;
      }
      result.succeeded += 1;
    } catch (err) {
      result.errors.push({
        title: g.title,
        reason: err instanceof Error ? err.message : String(err),
      });
    }

    // Tiny delay between requests — polite scraping.
    if (i < games.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_FETCHES_MS));
    }
  }

  revalidatePath("/", "layout");
  return result;
}
