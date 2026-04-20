"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConsoleBadge } from "@/components/ConsoleBadge";
import { formatPercent, formatUSD, profitPercent } from "@/lib/format";
import type { Console, RetroGame } from "@/lib/supabase/database.types";

const CONSOLES: readonly (Console | "All")[] = [
  "All", "PS2", "MD", "Genesis", "Saturn", "SFC", "SNES", "Switch",
] as const;

type SortKey = "title" | "console" | "purchase_price" | "current_market_price" | "profit";
type SortDir = "asc" | "desc";

export function GamesTable({ games }: { games: RetroGame[] }) {
  const [consoleFilter, setConsoleFilter] = useState<Console | "All">("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("current_market_price");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    let r = games;
    if (consoleFilter !== "All") r = r.filter((g) => g.console === consoleFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((g) => g.title.toLowerCase().includes(q));
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...r].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv) * dir;
      }
      return ((av as number) - (bv as number)) * dir;
    });
  }, [games, consoleFilter, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" || key === "console" ? "asc" : "desc");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-stone-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {CONSOLES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConsoleFilter(c)}
              className={`rounded px-2 py-1 text-xs ${
                consoleFilter === c
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-stone-500">{rows.length} shown</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
            <tr>
              <Th onClick={() => toggleSort("title")} active={sortKey === "title"} dir={sortDir}>Title</Th>
              <Th onClick={() => toggleSort("console")} active={sortKey === "console"} dir={sortDir}>Console</Th>
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2">Cond.</th>
              <Th right onClick={() => toggleSort("purchase_price")} active={sortKey === "purchase_price"} dir={sortDir}>Paid</Th>
              <Th right onClick={() => toggleSort("current_market_price")} active={sortKey === "current_market_price"} dir={sortDir}>Market</Th>
              <Th right onClick={() => toggleSort("profit")} active={sortKey === "profit"} dir={sortDir}>Profit</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((g) => {
              const profit = g.current_market_price - g.purchase_price;
              const pct = profitPercent(g.current_market_price, g.purchase_price);
              const profitClass = profit >= 0 ? "text-emerald-700" : "text-red-700";
              return (
                <tr key={g.id} className="hover:bg-stone-50">
                  <td className="px-3 py-2">
                    <Link href={`/games/${g.id}`} className="flex items-center gap-3 hover:underline">
                      <div className="relative h-10 w-8 flex-shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-100">
                        {g.cover_url ? (
                          <Image
                            src={g.cover_url}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <span className="font-medium">{g.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2"><ConsoleBadge value={g.console} /></td>
                  <td className="px-3 py-2 text-xs text-stone-600">{g.region}</td>
                  <td className="px-3 py-2 text-xs text-stone-600">{g.condition}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatUSD(g.purchase_price)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatUSD(g.current_market_price)}</td>
                  <td className={`px-3 py-2 text-right font-mono ${profitClass}`}>
                    {formatUSD(profit)} <span className="text-xs">({formatPercent(pct)})</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-stone-500">
                  No games match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function sortValue(g: RetroGame, key: SortKey): string | number {
  switch (key) {
    case "title": return g.title;
    case "console": return g.console;
    case "purchase_price": return g.purchase_price;
    case "current_market_price": return g.current_market_price;
    case "profit": return g.current_market_price - g.purchase_price;
  }
}

function Th({
  children, onClick, active, dir, right,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDir;
  right?: boolean;
}) {
  const arrow = active ? (dir === "asc" ? " ↑" : " ↓") : "";
  return (
    <th className={`px-3 py-2 ${right ? "text-right" : ""}`}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={`hover:text-stone-900 ${active ? "text-stone-900" : ""}`}
        >
          {children}{arrow}
        </button>
      ) : (
        children
      )}
    </th>
  );
}
