"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MOCK_GAMES } from "@/lib/data/mock-games";

export async function seedDemoData(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Strip the mock id and owner_id — let the DB generate a fresh id, and
  // RLS sets owner_id from auth.uid() (we still pass it explicitly because
  // RLS only checks, doesn't fill).
  const rows = MOCK_GAMES.map((g) => ({
    owner_id: user.id,
    title: g.title,
    console: g.console,
    condition: g.condition,
    region: g.region,
    current_market_price: g.current_market_price,
    purchase_price: g.purchase_price,
    notes: g.notes,
    photos: g.photos,
  }));

  const { error } = await supabase.from("retro_games").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  redirect("/games");
}
