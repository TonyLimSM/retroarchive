"use client";

import { useState, useTransition } from "react";
import { backfillCovers, type BackfillResult } from "./actions";

export function BackfillCoversButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BackfillResult | null>(null);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      setResult(await backfillCovers());
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-stone-50 disabled:opacity-50"
      >
        {isPending ? "Fetching covers…" : "Backfill missing cover art"}
      </button>
      {isPending && (
        <p className="text-xs text-stone-600">
          Pulling from IGDB at ~3 per second. Won&apos;t touch games that
          already have covers.
        </p>
      )}
      {result && (
        <div className="rounded border border-stone-200 bg-white p-3 text-xs">
          <p className="font-medium">
            Filled in {result.succeeded} of {result.attempted} missing covers
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
