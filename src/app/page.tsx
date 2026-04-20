import Link from "next/link";
import { isDemoMode, listGames } from "@/lib/data/games";
import { formatPercent, formatUSD, profitPercent } from "@/lib/format";
import type { Console } from "@/lib/supabase/database.types";
import { ConsoleBadge } from "@/components/ConsoleBadge";
import { getCurrentUser } from "@/lib/supabase/auth";
import { RefreshAllButton } from "@/app/_refresh-all/RefreshAllButton";
import { BackfillCoversButton } from "@/app/_backfill-covers/BackfillCoversButton";

export default async function DashboardPage() {
  if (!isDemoMode) {
    const user = await getCurrentUser();
    if (!user) return <SignedOutPrompt />;
  }
  const games = await listGames();
  if (games.length === 0) return <EmptyCollectionPrompt />;

  const totalCount = games.length;
  const totalPaid = games.reduce((sum, g) => sum + g.purchase_price, 0);
  const totalMarket = games.reduce((sum, g) => sum + g.current_market_price, 0);
  const totalProfit = totalMarket - totalPaid;

  // Per-console breakdown.
  const byConsole = new Map<Console, { count: number; market: number }>();
  for (const g of games) {
    const cur = byConsole.get(g.console) ?? { count: 0, market: 0 };
    cur.count += 1;
    cur.market += g.current_market_price;
    byConsole.set(g.console, cur);
  }
  const consoleRows = [...byConsole.entries()]
    .map(([console, v]) => ({ console, ...v }))
    .sort((a, b) => b.market - a.market);
  const maxMarket = Math.max(...consoleRows.map((r) => r.market), 1);

  // Top 5 most valuable.
  const topFive = [...games]
    .sort((a, b) => b.current_market_price - a.current_market_price)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Collection overview</h1>
        <p className="mt-1 text-sm text-stone-600">
          {totalCount} cartridges across {byConsole.size} consoles.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Items" value={totalCount.toString()} />
        <Stat label="Paid total" value={formatUSD(totalPaid)} />
        <Stat label="Market total" value={formatUSD(totalMarket)} />
        <Stat
          label="Unrealized profit"
          value={formatUSD(totalProfit)}
          accent={totalProfit >= 0 ? "positive" : "negative"}
          sub={formatPercent(profitPercent(totalMarket, totalPaid))}
        />
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Market value by console
          </h2>
          <ul className="space-y-3">
            {consoleRows.map((row) => (
              <li key={row.console}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ConsoleBadge value={row.console} />
                    <span className="text-stone-500">×{row.count}</span>
                  </span>
                  <span className="font-mono">{formatUSD(row.market)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full bg-stone-800"
                    style={{ width: `${(row.market / maxMarket) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Top 5 by market price
          </h2>
          <ul className="divide-y divide-stone-100">
            {topFive.map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/games/${g.id}`} className="flex items-center gap-2 hover:underline">
                  <ConsoleBadge value={g.console} />
                  <span className="truncate">{g.title}</span>
                </Link>
                <span className="ml-3 font-mono">{formatUSD(g.current_market_price)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {!isDemoMode && (
        <section className="rounded-lg border border-stone-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Maintenance
          </h2>
          <RefreshAllButton />
          <BackfillCoversButton />
        </section>
      )}

      {isDemoMode && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm">
          <h2 className="mb-2 font-semibold text-amber-900">Pricing is approximate</h2>
          <p className="text-amber-900/80">
            Market values are rough estimates seeded for the demo. Connect Supabase
            to unlock live pricing via PriceCharting.
          </p>
        </section>
      )}
    </div>
  );
}

function SignedOutPrompt() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">RetroVault</h1>
      <p className="mt-2 text-sm text-stone-600">
        Sign in to see your collection.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      >
        Sign in
      </Link>
    </div>
  );
}

function EmptyCollectionPrompt() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No games yet</h1>
      <p className="mt-2 text-sm text-stone-600">
        Your collection is empty. Try the demo data, or upload a CSV of your
        real collection.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/seed"
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Seed demo data
        </Link>
        <Link
          href="/import"
          className="rounded border border-stone-300 px-4 py-2 text-sm font-medium"
        >
          Import CSV
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "positive" | "negative";
}) {
  const accentClass =
    accent === "positive"
      ? "text-emerald-700"
      : accent === "negative"
      ? "text-red-700"
      : "text-stone-900";
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</div>
      {sub && <div className={`text-sm ${accentClass}`}>{sub}</div>}
    </div>
  );
}
