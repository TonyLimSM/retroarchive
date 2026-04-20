"use server";

import Papa from "papaparse";
import { createClient } from "@/lib/supabase/server";
import type { RetroGameInsert } from "@/lib/supabase/database.types";
import { mapRowToGame, type RawRow } from "./mapping";
import { revalidatePath } from "next/cache";

export type ImportResult = {
  inserted: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export async function importGamesCsv(formData: FormData): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");

  const text = await file.text();
  const parsed = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };
  const toInsert: RetroGameInsert[] = [];

  parsed.data.forEach((row, i) => {
    try {
      const mapped = mapRowToGame(row);
      if (mapped === null) {
        result.skipped += 1;
        return;
      }
      // RLS only *checks* owner_id, it doesn't fill it — set it here.
      toInsert.push({ ...mapped, owner_id: user.id });
    } catch (err) {
      result.errors.push({
        row: i + 2, // +1 for header, +1 for 1-indexed
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  });

  if (toInsert.length > 0) {
    // Insert in chunks of 500 to stay well under Postgres parameter limits.
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const { error } = await supabase.from("retro_games").insert(chunk);
      if (error) throw new Error(`Insert failed at row ${i}: ${error.message}`);
      result.inserted += chunk.length;
    }
  }

  revalidatePath("/games");
  return result;
}
