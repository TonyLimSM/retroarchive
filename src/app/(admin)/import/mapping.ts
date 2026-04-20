import type {
  RetroGameInsert,
  Console,
  Condition,
  Region,
} from "@/lib/supabase/database.types";

/**
 * A raw CSV row, keys are whatever your column headers are.
 * Papaparse produces this when called with { header: true }.
 */
export type RawRow = Record<string, string | undefined>;

const CONSOLES: readonly Console[] = [
  "PS2", "MD", "Genesis", "Saturn", "SFC", "SNES", "Switch",
] as const;
const CONDITIONS: readonly Condition[] = ["Loose", "CIB", "New"] as const;
const REGIONS: readonly Region[] = ["JP", "US", "EU", "Other"] as const;

// ---- helpers you can use in mapRowToGame -----------------------------------

export function parseEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  field: string,
): T {
  const v = (value ?? "").trim();
  if (!allowed.includes(v as T)) {
    throw new Error(
      `${field}: "${v}" is not one of ${allowed.join(", ")}`,
    );
  }
  return v as T;
}

export function parsePrice(value: string | undefined, field: string): number {
  const cleaned = (value ?? "").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${field}: "${value}" is not a valid non-negative number`);
  }
  return n;
}

// ---- the part you write ----------------------------------------------------

/**
 * Map ONE CSV row to a RetroGameInsert (or `null` to skip the row, e.g. for
 * blank rows or rows you've already imported).
 *
 * TODO(you): wire this to YOUR spreadsheet's column names.
 *
 * Look at one row of your real CSV, then:
 *   1. Read the right columns out of `row` (e.g. `row['Title']`, `row['Sys']`).
 *   2. Normalize console names → one of: PS2 / MD / Genesis / Saturn / SFC / SNES.
 *      (e.g. "Super Famicom" → "SFC", "Mega Drive JP" → "MD")
 *   3. Normalize condition → Loose / CIB / New.
 *   4. Normalize region → JP / US / EU / Other.
 *   5. Parse prices with parsePrice() (it strips ¥, $, commas).
 *   6. Decide skip rules: return `null` for blank rows or already-sold items.
 *
 * Throw an Error from inside this function for rows that look broken — the
 * import action will catch it and report `{ row: N, reason: "..." }` instead
 * of failing the whole batch.
 *
 * Example sketch (replace with your real columns):
 *
 *   const title = row['Title']?.trim();
 *   if (!title) return null;
 *
 *   return {
 *     title,
 *     console:   normalizeConsole(row['System']),  // helper you write
 *     condition: parseEnum(row['Condition'], ['Loose','CIB','New'], 'condition'),
 *     region:    parseEnum(row['Region'],    ['JP','US','EU','Other'], 'region'),
 *     current_market_price: parsePrice(row['Market'],   'current_market_price'),
 *     purchase_price:       parsePrice(row['Paid'],     'purchase_price'),
 *     notes: row['Notes']?.trim() || null,
 *   };
 */
// Matches the columns in public/collection-template.csv:
//   title,console,region,condition,purchase_price,current_market_price,notes
export function mapRowToGame(row: RawRow): RetroGameInsert | null {
  const title = (row.title ?? "").trim();
  if (!title) return null; // skip blank rows

  return {
    title,
    console: parseEnum(row.console, CONSOLES, "console"),
    region: row.region?.trim()
      ? parseEnum(row.region, REGIONS, "region")
      : "JP",
    condition: row.condition?.trim()
      ? parseEnum(row.condition, CONDITIONS, "condition")
      : "CIB",
    purchase_price: parsePrice(row.purchase_price, "purchase_price"),
    current_market_price: parsePrice(
      row.current_market_price ?? "0",
      "current_market_price",
    ),
    notes: row.notes?.trim() || null,
  };
}
