// Hand-written to match supabase/migrations/20260417000000_create_retro_games.sql.
// Once you link the Supabase CLI, regenerate with:
//   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts

export type Console = "PS2" | "MD" | "Genesis" | "Saturn" | "SFC" | "SNES" | "Switch";
export type Condition = "Loose" | "CIB" | "New";
export type Region = "JP" | "US" | "EU" | "Other";

export type RetroGame = {
  id: string;
  owner_id: string;
  title: string;
  console: Console;
  condition: Condition;
  region: Region;
  current_market_price: number;
  purchase_price: number;
  notes: string | null;
  photos: string[];
  cover_url: string | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RetroGameInsert = Omit<
  RetroGame,
  "id" | "owner_id" | "created_at" | "updated_at" | "photos" | "region" | "notes" | "cover_url" | "price_updated_at"
> & {
  id?: string;
  owner_id?: string;
  region?: Region;
  notes?: string | null;
  photos?: string[];
  cover_url?: string | null;
  price_updated_at?: string | null;
};

export type RetroGameUpdate = Partial<RetroGameInsert>;

export type Database = {
  public: {
    Tables: {
      retro_games: {
        Row: RetroGame;
        Insert: RetroGameInsert;
        Update: RetroGameUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      console_type: Console;
      condition_type: Condition;
      region_type: Region;
    };
    CompositeTypes: Record<string, never>;
  };
};
