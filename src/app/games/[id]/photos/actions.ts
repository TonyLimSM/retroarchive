"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function attachPhotos(gameId: string, paths: string[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  // Read current photos so we append rather than overwrite.
  // RLS already restricts this to the owner's own row.
  const { data: existing, error: readError } = await supabase
    .from("retro_games")
    .select("photos")
    .eq("id", gameId)
    .single();
  if (readError) throw new Error(readError.message);

  const merged = Array.from(new Set([...(existing?.photos ?? []), ...paths]));

  const { error: updateError } = await supabase
    .from("retro_games")
    .update({ photos: merged })
    .eq("id", gameId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/games/${gameId}`);
}
