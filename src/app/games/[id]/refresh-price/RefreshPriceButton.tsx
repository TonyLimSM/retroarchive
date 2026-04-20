"use client";

import { useState, useTransition } from "react";
import { formatUSD } from "@/lib/format";
import { refreshPrice, type RefreshResult } from "./actions";

export function RefreshPriceButton({
  gameId,
  currentPrice,
}: {
  gameId: string;
  currentPrice: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshResult | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      const r = await refreshPrice(gameId);
      setResult(r);
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone-50 disabled:opacity-50"
      >
        {isPending ? "Fetching…" : "Refresh from PriceCharting"}
      </button>
      {result?.ok && (
        <p className="text-xs text-emerald-700">
          Updated: {formatUSD(currentPrice)} → {formatUSD(result.price)}{" "}
          <a
            href={result.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            source
          </a>
        </p>
      )}
      {result && !result.ok && (
        <p className="text-xs text-red-700">{result.reason}</p>
      )}
    </div>
  );
}
