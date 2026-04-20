import type { RetroGame } from "../supabase/database.types";
import { MOCK_GAMES } from "./mock-games";

const useMock = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const isDemoMode = useMock;

export async function listGames(): Promise<RetroGame[]> {
  if (useMock) {
    // Return a copy so callers can sort/filter without mutating the seed.
    return [...MOCK_GAMES];
  }
  const { createClient } = await import("../supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("retro_games")
    .select("*")
    .order("current_market_price", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getGame(id: string): Promise<RetroGame | null> {
  if (useMock) {
    return MOCK_GAMES.find((g) => g.id === id) ?? null;
  }
  const { createClient } = await import("../supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("retro_games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
