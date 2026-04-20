import type { RetroGame } from "../supabase/database.types";

const OWNER = "00000000-0000-0000-0000-000000000000";
const NOW = "2026-04-17T00:00:00Z";

// Approximate USD market values for CIB copies, mid-2026 ballpark.
// Replace with PriceCharting data once integrated.
type Seed = {
  title: string;
  console: RetroGame["console"];
  region: RetroGame["region"];
  market: number;
  paid: number;
  notes?: string;
};

const SEEDS: Seed[] = [
  // SFC (Super Famicom — JP)
  { title: "Recca: Summer Carnival '92",  console: "SFC",     region: "JP", market: 1500, paid: 600,  notes: "Box has light wear, manual mint" },
  { title: "Hagane: The Final Conflict",  console: "SFC",     region: "JP", market: 420,  paid: 180,                                              },
  { title: "Aero Fighters",               console: "SFC",     region: "JP", market: 320,  paid: 140                                               },
  { title: "Rendering Ranger R2",         console: "SFC",     region: "JP", market: 2400, paid: 900,  notes: "Holy grail; sealed end-cap intact"  },
  { title: "Wild Guns",                   console: "SFC",     region: "JP", market: 220,  paid: 90                                                },

  // SNES (US)
  { title: "EarthBound",                  console: "SNES",    region: "US", market: 750,  paid: 300,  notes: "Big box, scratch-and-sniff intact"  },
  { title: "Chrono Trigger",              console: "SNES",    region: "US", market: 420,  paid: 150                                               },
  { title: "Mega Man X3",                 console: "SNES",    region: "US", market: 520,  paid: 240                                               },
  { title: "Harvest Moon",                console: "SNES",    region: "US", market: 310,  paid: 110                                               },
  { title: "Final Fantasy III",           console: "SNES",    region: "US", market: 210,  paid: 80                                                },

  // Saturn (mostly JP)
  { title: "Panzer Dragoon Saga",         console: "Saturn",  region: "US", market: 850,  paid: 400,  notes: "4-disc set, all manuals present"    },
  { title: "Radiant Silvergun",           console: "Saturn",  region: "JP", market: 720,  paid: 280                                               },
  { title: "Burning Rangers",             console: "Saturn",  region: "JP", market: 380,  paid: 160                                               },
  { title: "Magic Knight Rayearth",       console: "Saturn",  region: "US", market: 1200, paid: 500,  notes: "Last official US Saturn release"    },
  { title: "Saturn Bomberman",            console: "Saturn",  region: "JP", market: 230,  paid: 95                                                },

  // MD (Mega Drive — JP)
  { title: "Alien Soldier",               console: "MD",      region: "JP", market: 320,  paid: 120                                               },
  { title: "Crusader of Centy (Soleil)",  console: "MD",      region: "JP", market: 410,  paid: 180                                               },
  { title: "Pulseman",                    console: "MD",      region: "JP", market: 360,  paid: 150,  notes: "Game Freak pre-Pokémon"             },
  { title: "Treasure Hunter G",           console: "MD",      region: "JP", market: 220,  paid: 90                                                },

  // Genesis (US)
  { title: "Vectorman 2",                 console: "Genesis", region: "US", market: 85,   paid: 30                                                },
  { title: "Comix Zone",                  console: "Genesis", region: "US", market: 65,   paid: 22                                                },
  { title: "Phantasy Star IV",            console: "Genesis", region: "US", market: 240,  paid: 100,  notes: "Big-box, map insert present"        },
  { title: "Crusader of Centy",           console: "Genesis", region: "US", market: 320,  paid: 130                                               },

  // PS2
  { title: "Rule of Rose",                console: "PS2",     region: "US", market: 420,  paid: 180,  notes: "Disc near-mint"                     },
  { title: "Haunting Ground",             console: "PS2",     region: "US", market: 310,  paid: 130                                               },
  { title: "Kuon",                        console: "PS2",     region: "US", market: 320,  paid: 140                                               },
  { title: "Suikoden V",                  console: "PS2",     region: "US", market: 160,  paid: 60                                                },
  { title: "Suikoden III",                console: "PS2",     region: "US", market: 150,  paid: 55                                                },
  { title: "Persona 4",                   console: "PS2",     region: "US", market: 90,   paid: 30                                                },
];

// Stable, deterministic UUIDs so the same seed = same id across reloads.
function seedId(i: number): string {
  const hex = i.toString(16).padStart(12, "0");
  return `00000000-0000-0000-0000-${hex}`;
}

export const MOCK_GAMES: RetroGame[] = SEEDS.map((s, i) => ({
  id: seedId(i),
  owner_id: OWNER,
  title: s.title,
  console: s.console,
  condition: "CIB", // entire collection is CIB per user
  region: s.region,
  current_market_price: s.market,
  purchase_price: s.paid,
  notes: s.notes ?? null,
  photos: [],
  cover_url: null,
  price_updated_at: null,
  created_at: NOW,
  updated_at: NOW,
}));
