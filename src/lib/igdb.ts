// IGDB (Twitch-owned game database) client for auto-fetching cover art.
// Free API, rate limit ~4 req/sec. Credentials read from env:
//   TWITCH_CLIENT_ID     (Client ID from dev.twitch.tv)
//   TWITCH_CLIENT_SECRET (Client Secret from dev.twitch.tv)
//
// SERVER-ONLY: these env vars have no NEXT_PUBLIC_ prefix, so Next.js
// never ships them to the browser. Callers must be server actions or
// route handlers.

import type { Console } from "./supabase/database.types";

// IGDB internal platform IDs — Google "IGDB platforms" to see the full list.
// Empirically verified against their /v4/platforms endpoint.
const PLATFORM_IDS: Record<Console, number> = {
  PS2:     8,
  MD:      29, // IGDB groups Mega Drive + Genesis under one platform
  Genesis: 29,
  Saturn:  32,
  SFC:     58,
  SNES:    19,
  Switch:  130,
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) return cachedToken.token;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET not set");
  }

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const res = await fetch(url, { method: "POST", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Twitch OAuth failed: ${res.status}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };

  // Subtract 60s as safety margin — reissue slightly before actual expiry.
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

/**
 * Find the IGDB cover URL for a game on a specific console.
 * Returns null if the game can't be found or has no cover.
 *
 * Image sizing: `t_cover_big` is ~264×374, ~20-40KB. Good tradeoff between
 * quality and bandwidth. For thumbnail use cases, swap to `t_cover_small`.
 */
export async function findCoverUrl(
  title: string,
  console: Console,
): Promise<string | null> {
  const platformId = PLATFORM_IDS[console];
  if (!platformId) return null;

  // IGDB's search requires ALL query words to match somewhere in the title.
  // "E-SWAT: Cyber Police" misses because the game is just "ESWAT: City
  // Under Siege" — "Cyber Police" isn't in any title. So we try the full
  // title first, and fall back to just the part before a colon, which is
  // usually the main title and almost always hits.
  const variants = [
    title,
    title.includes(":") ? title.split(":")[0] : null,
  ].filter((t): t is string => !!t);

  const token = await getToken();

  for (const raw of variants) {
    const cleanTitle = raw
      .replace(/[-']/g, "")
      .replace(/[:!?&]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleanTitle) continue;
    const escapedTitle = cleanTitle.replace(/"/g, '\\"');

    const res = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      cache: "no-store",
      body:
        `search "${escapedTitle}"; ` +
        `fields name,cover.image_id; ` +
        `where platforms = (${platformId}); ` +
        `limit 1;`,
    });

    if (!res.ok) continue;
    const data = (await res.json()) as { cover?: { image_id: string } }[];
    const imageId = data[0]?.cover?.image_id;
    if (imageId) {
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
    }
  }

  return null;
}
