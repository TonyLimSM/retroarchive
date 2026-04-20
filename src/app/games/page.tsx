import Link from "next/link";
import { redirect } from "next/navigation";
import { isDemoMode, listGames } from "@/lib/data/games";
import { getCurrentUser } from "@/lib/supabase/auth";
import { GamesView } from "./GamesView";

export default async function GamesPage() {
  if (!isDemoMode) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
  }
  const games = await listGames();
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Games</h1>
        <p className="text-sm text-stone-600">{games.length} items</p>
      </header>
      {games.length === 0 ? (
        <p className="text-sm text-stone-600">
          No games yet. Try{" "}
          <Link href="/seed" className="underline">seeding demo data</Link>{" "}
          or{" "}
          <Link href="/import" className="underline">importing a CSV</Link>.
        </p>
      ) : (
        <GamesView games={games} />
      )}
    </div>
  );
}
