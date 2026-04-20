"use client";

import { useState, useTransition } from "react";
import { updatePurchasePrice, type EditResult } from "./actions";

export function EditPurchasePrice({
  gameId,
  initialPrice,
}: {
  gameId: string;
  initialPrice: number;
}) {
  const [value, setValue] = useState(initialPrice.toString());
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EditResult | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      setResult(await updatePurchasePrice(gameId, value));
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-stone-100 pb-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        Paid
      </label>
      <div className="flex flex-1 items-center gap-1">
        <span className="font-mono text-stone-400">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
          className="w-24 rounded border border-stone-300 px-2 py-0.5 text-right font-mono text-sm focus:border-stone-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || value === initialPrice.toString()}
          className="ml-1 rounded border border-stone-300 bg-white px-2 py-0.5 text-xs font-medium hover:bg-stone-50 disabled:opacity-40"
        >
          {isPending ? "…" : result?.ok ? "✓" : "Save"}
        </button>
      </div>
      {result && !result.ok && (
        <span className="text-xs text-red-700">{result.reason}</span>
      )}
    </form>
  );
}
