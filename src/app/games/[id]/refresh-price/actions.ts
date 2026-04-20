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

  const { error: updateError } = await supabase
    .from("retro_games")
    .update({
      current_market_price: picked,
      price_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (updateError) return { ok: false, reason: updateError.message };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  revalidatePath("/");

  return { ok: true, price: picked, sourceUrl: url };
}
