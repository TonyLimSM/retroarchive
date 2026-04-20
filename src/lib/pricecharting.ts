// Lightweight server-side scraper for PriceCharting public pages.
// No API key, no account. In exchange: fragile to HTML changes. If this ever
// breaks, migrate to eBay Browse API (see CLAUDE.md).
//
// Etiquette: one fetch per game per week max. Enforced by the server action
// that calls this module, not here.

import type { Condition, Console, Region } from "./supabase/database.types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Map our Console enum + Region to PriceCharting's URL slug system.
// Empirically derived by inspecting search results.
const CONSOLE_SLUGS: Record<Console, Partial<Record<Region, string>>> = {
  PS2:     { JP: "jp-playstation-2", US: "playstation-2", EU: "pal-playstation-2", Other: "playstation-2" },
  MD:      { JP: "jp-sega-mega-drive",                     EU: "pal-sega-mega-drive", Other: "jp-sega-mega-drive" },
  Genesis: { US: "sega-genesis", Other: "sega-genesis" },
  Saturn:  { JP: "jp-sega-saturn", US: "sega-saturn", EU: "pal-sega-saturn", Other: "jp-sega-saturn" },
  SFC:     { JP: "super-famicom", Other: "super-famicom" },
  SNES:    { US: "super-nintendo", EU: "pal-super-nintendo", Other: "super-nintendo" },
  Switch:  { JP: "jp-nintendo-switch", US: "nintendo-switch", EU: "pal-nintendo-switch", Other: "nintendo-switch" },
};

export type Prices = {
  loose: number | null;
  cib: number | null;
  newSealed: number | null;
  sourceUrl: string;
};

/**
 * Find the PriceCharting detail-page URL for a game, scoped to the expected
 * console+region slug.
 *
 * Returns null if no matching result exists — caller should treat that as
 * "unknown price, don't clobber the existing value".
 */
export async function findPricechartingUrl(
  title: string,
  console: Console,
  region: Region,
): Promise<string | null> {
  const expectedSlug = CONSOLE_SLUGS[console]?.[region];
  if (!expectedSlug) return null;

  // PriceCharting's search is punctuation-sensitive: "E-SWAT" returns nothing
  // but "ESWAT" hits. Remove in-word punctuation (dash, apostrophe) entirely
  // so "E-SWAT" → "ESWAT", "Sonic's" → "Sonics". Treat colon/! as word
  // separators (convert to space) so "X: Subtitle" → "X Subtitle".
  const cleanTitle = title
    .replace(/[-']/g, "")
    .replace(/[:!?&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const searchUrl = new URL("https://www.pricecharting.com/search-products");
  searchUrl.searchParams.set("q", cleanTitle);
  searchUrl.searchParams.set("type", "prices");

  const res = await fetch(searchUrl, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();

  // Match every /game/<console-slug>/<game-slug> link. PriceCharting renders
  // these as absolute URLs (https://www.pricecharting.com/game/...) — the
  // `(?:https?:\/\/[^"/]+)?` prefix lets us tolerate either absolute or
  // relative in case they ever change that.
  const linkPattern =
    /href="(?:https?:\/\/[^"/]+)?(\/game\/([a-z0-9-]+)\/[a-z0-9-]+)"/g;
  const seen = new Set<string>();
  for (const m of html.matchAll(linkPattern)) {
    const path = m[1];
    const slug = m[2];
    if (seen.has(path)) continue;
    seen.add(path);
    if (slug === expectedSlug) {
      return `https://www.pricecharting.com${path}`;
    }
  }
  return null;
}

/**
 * Fetch the three prices (loose / CIB / new) from a PriceCharting game page.
 * Returns null values for any price that's missing on the page (e.g. a game
 * that's never sold Sealed won't have a New price).
 */
export async function fetchPrices(url: string): Promise<Prices | null> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();

  return {
    loose:     extractPrice(html, "used_price"),
    cib:       extractPrice(html, "complete_price"),
    newSealed: extractPrice(html, "new_price"),
    sourceUrl: url,
  };
}

function extractPrice(html: string, tdId: string): number | null {
  // The page renders a span like:
  //   <td id="complete_price"><span class="price js-price">$126.17</span></td>
  // Missing prices render as "---" or empty — both map to null.
  const pattern = new RegExp(
    `id="${tdId}"[^>]*>\\s*<span[^>]*>\\s*([^<]+?)\\s*</span>`,
    "i",
  );
  const match = html.match(pattern);
  if (!match) return null;
  const text = match[1].trim();
  const cleaned = text.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pick which of the three prices to use as `current_market_price` based on
 * the user-recorded condition.
 */
export function pricesForCondition(
  prices: Prices,
  condition: Condition,
): number | null {
  switch (condition) {
    case "Loose": return prices.loose;
    case "CIB":   return prices.cib;
    case "New":   return prices.newSealed;
  }
}
