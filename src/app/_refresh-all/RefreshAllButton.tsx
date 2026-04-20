"use client";

import { useState, useTransition } from "react";
import { refreshAllStalePrices, type BulkRefreshResult } from "./actions";

export function RefreshAllButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkRefreshResult | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      setResult(await refreshAllStalePrices());
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Fetching prices…" : "Refresh all stale prices"}
      </button>
      {isPending && (
        <p className="text-xs text-stone-600">
          Hitting PriceCharting sequentially with a small delay. For a big
          collection this can take a couple minutes — don&apos;t refresh the page.
        </p>
      )}
      {result && (
        <div className="rounded border border-stone-200 bg-white p-3 text-xs">
          <p className="font-medium">
            Refreshed {result.succeeded} of {result.attempted}
            {result.skipped > 0 && ` (${result.skipped} skipped)`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-4 text-stone-600">
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i}>
                  <span className="font-medium">{e.title}</span>: {e.reason}
                </li>
              ))}
              {result.errors.length > 10 && (
                <li>…and {result.errors.length - 10} more</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
