"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findCoverUrl } from "@/lib/igdb";

const DELAY_BETWEEN_FETCHES_MS = 250; // IGDB limit is 4 req/s; 250ms gives us headroom

export type BackfillResult = {
  attempted: number;
  succeeded: number;
  errors: { title: string; reason: string }[];
};

/**
 * Fetch cover art from IGDB for every game that currently has cover_url = null.
 * Does NOT overwrite existing cover_urls — use a separate "force refresh"
 * action if you want that behavior. This is explicitly "fill in the blanks".
 */
export async function backfillCovers(): Promise<BackfillResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      attempted: 0, succeeded: 0,
      errors: [{ title: "(auth)", reason: "Not signed in" }],
    };
  }

  const { data: games, error: listError } = await supabase
    .from("retro_games")
    .select("id, title, console")
    .is("cover_url", null)
    .order("created_at", { ascending: true });
  if (listError) {
    return {
      attempted: 0, succeeded: 0,
      errors: [{ title: "(query)", reason: listError.message }],
    };
  }
  if (!games || games.length === 0) {
    return { attempted: 0, succeeded: 0, errors: [] };
  }

  const result: BackfillResult = {
    attempted: games.length, succeeded: 0, errors: [],
  };

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    try {
      const url = await findCoverUrl(g.title, g.console);
      if (!url) {
        result.errors.push({ title: g.title, reason: "No IGDB cover found" });
        continue;
      }
      const { error: updateError } = await supabase
        .from("retro_games")
        .update({ cover_url: url })
        .eq("id", g.id);
      if (updateError) {
        result.errors.push({ title: g.title, reason: updateError.message });
        continue;
      }
      result.succeeded += 1;
    } catch (err) {
      result.errors.push({
        title: g.title,
        reason: err instanceof Error ? err.message : String(err),
      });
    }

    if (i < games.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_FETCHES_MS));
    }
  }

  revalidatePath("/", "layout");
  return result;
}
