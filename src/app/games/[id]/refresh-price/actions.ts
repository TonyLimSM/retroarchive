"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPrices,
  findPricechartingUrl,
  pricesForCondition,
} from "@/lib/pricecharting";

export type RefreshResult =
  | { ok: true; price: number; sourceUrl: string }
  | { ok: false; reason: string };

export async function refreshPrice(gameId: string): Promise<RefreshResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, reason: "Not signed in" };

  const { data: game, error: readError } = await supabase
    .from("retro_games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (readError || !game) {
    return { ok: false, reason: readError?.message ?? "Game not found" };
  }

  const url = await findPricechartingUrl(game.title, game.console, game.region);
  if (!url) {
    return {
      ok: false,
      reason: `No PriceCharting match for "${game.title}" (${game.console}, ${game.region})`,
    };
  }

  const prices = await fetchPrices(url);
  if (!prices) {
    return { ok: false, reason: "PriceCharting returned no prices" };
  }

  const picked = pricesForCondition(prices, game.condition);
  if (picked === null) {
    return {
      ok: false,
      reason: `No ${game.condition} price listed on PriceCharting for this game`,
    };
  }

  const now = new Date().toISOString();

  // Run update + history insert in parallel — both are independent writes.
  // If the history insert fails we don't want to block the price update.
  const [updateResult] = await Promise.all([
    supabase
      .from("retro_games")
      .update({ current_market_price: picked, price_updated_at: now })
      .eq("id", gameId),
    supabase.from("price_history").insert({
      game_id: gameId,
      owner_id: user.id,
      price: picked,
      condition: game.condition,
      source: "pricecharting",
      recorded_at: now,
    }),
  ]);
  if (updateResult.error) return { ok: false, reason: updateResult.error.message };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  revalidatePath("/");

  return { ok: true, price: picked, sourceUrl: url };
}
