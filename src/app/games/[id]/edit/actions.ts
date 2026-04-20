"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EditResult = { ok: true } | { ok: false; reason: string };

export async function updatePurchasePrice(
  gameId: string,
  rawPrice: string,
): Promise<EditResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, reason: "Not signed in" };

  // Strip currency symbols, commas, spaces before parsing.
  const n = Number(rawPrice.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, reason: "Enter a non-negative number" };
  }

  const { error } = await supabase
    .from("retro_games")
    .update({ purchase_price: n })
    .eq("id", gameId);
  if (error) return { ok: false, reason: error.message };

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  revalidatePath("/");
  return { ok: true };
}
