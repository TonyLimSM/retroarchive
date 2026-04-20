import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsoleBadge } from "@/components/ConsoleBadge";
import { getGame, isDemoMode } from "@/lib/data/games";
import { formatPercent, formatUSD, profitPercent } from "@/lib/format";
import { PhotoUploader } from "./photos/PhotoUploader";
import { RefreshPriceButton } from "./refresh-price/RefreshPriceButton";
import { EditPurchasePrice } from "./edit/EditPurchasePrice";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  const profit = game.current_market_price - game.purchase_price;
  const pct = profitPercent(game.current_market_price, game.purchase_price);
  const profitClass = profit >= 0 ? "text-emerald-700" : "text-red-700";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="text-sm">
        <Link href="/games" className="text-stone-500 hover:underline">
          ← Back to games
        </Link>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <ConsoleBadge value={game.console} />
            <span className="text-xs text-stone-500">
              {game.region} · {game.condition}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{game.title}</h1>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-stone-500">Market</div>
          <div className="font-mono text-2xl font-semibold">
            {formatUSD(game.current_market_price)}
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            {game.cover_url ? (
              <Image
                src={game.cover_url}
                alt={`${game.title} cover art`}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-stone-400">
                <span className="text-sm">No cover art</span>
              </div>
            )}
          </div>

          {game.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {game.photos.map((p) => (
                <div
                  key={p}
                  className="relative aspect-square overflow-hidden rounded border border-stone-200 bg-white"
                >
                  {/* photos rendered once Supabase public URL helper is wired */}
                  <span className="absolute inset-0 grid place-items-center p-1 text-center text-[10px] break-all text-stone-500">
                    {p}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isDemoMode ? (
            <p className="text-xs text-stone-500">
              Photo uploads are disabled in demo mode (Supabase Storage not connected).
            </p>
          ) : (
            <PhotoUploader gameId={game.id} />
          )}
        </div>

        <aside className="space-y-3 text-sm">
          {!isDemoMode && (
            <RefreshPriceButton
              gameId={game.id}
              currentPrice={game.current_market_price}
            />
          )}
          {isDemoMode ? (
            <Field label="Paid">{formatUSD(game.purchase_price)}</Field>
          ) : (
            <EditPurchasePrice
              gameId={game.id}
              initialPrice={game.purchase_price}
            />
          )}
          <Field label="Market">{formatUSD(game.current_market_price)}</Field>
          <Field label="Profit">
            <span className={`font-mono ${profitClass}`}>
              {formatUSD(profit)} ({formatPercent(pct)})
            </span>
          </Field>
          <Field label="Region">{game.region}</Field>
          <Field label="Condition">{game.condition}</Field>
          {game.price_updated_at && (
            <Field label="Priced">
              {new Date(game.price_updated_at).toLocaleDateString()}
            </Field>
          )}
          {game.notes && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Notes
              </div>
              <p className="mt-1 text-stone-700">{game.notes}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-stone-100 pb-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      <span className="font-mono">{children}</span>
    </div>
  );
}
