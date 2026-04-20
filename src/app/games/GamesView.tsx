"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ConsoleBadge } from "@/components/ConsoleBadge";
import { formatPercent, formatUSD, profitPercent } from "@/lib/format";
import type { Console, RetroGame } from "@/lib/supabase/database.types";

const CONSOLES: readonly (Console | "All")[] = [
  "All", "PS2", "MD", "Genesis", "Saturn", "SFC", "SNES", "Switch",
] as const;

type SortKey = "title" | "console" | "purchase_price" | "current_market_price" | "profit";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

const VIEW_STORAGE_KEY = "retrovault.gamesView";

const SORT_LABELS: Record<SortKey, string> = {
  title: "Title",
  console: "Console",
  purchase_price: "Paid",
  current_market_price: "Market",
  profit: "Profit",
};

export function GamesView({ games }: { games: RetroGame[] }) {
  const [consoleFilter, setConsoleFilter] = useState<Console | "All">("All");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("current_market_price");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<ViewMode>("grid");

  // Restore view preference from localStorage after mount (SSR-safe).
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "table" || saved === "grid") setView(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

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

        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-stone-500">
            Sort:
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="rounded border border-stone-300 bg-white px-2 py-1 text-xs"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="rounded border border-stone-300 bg-white px-2 py-1 text-xs w-6"
              title="Reverse sort order"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </label>

          <div className="flex rounded border border-stone-300 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded px-2 py-0.5 text-xs ${
                view === "grid" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
              title="Grid view"
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded px-2 py-0.5 text-xs ${
                view === "table" ? "bg-stone-900 text-white" : "text-stone-600"
              }`}
              title="Table view"
            >
              Table
            </button>
          </div>

          <span className="text-xs text-stone-500">{rows.length} shown</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white px-6 py-10 text-center text-sm text-stone-500">
          No games match your filters.
        </div>
      ) : view === "grid" ? (
        <GridBody rows={rows} />
      ) : (
        <TableBody rows={rows} sortKey={sortKey} sortDir={sortDir} onToggleSort={toggleSort} />
      )}
    </>
  );
}

function GridBody({ rows }: { rows: RetroGame[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {rows.map((g) => {
        const profit = g.current_market_price - g.purchase_price;
        const pct = profitPercent(g.current_market_price, g.purchase_price);
        const profitClass = profit >= 0 ? "text-emerald-700" : "text-red-700";
        return (
          <Link
            key={g.id}
            href={`/games/${g.id}`}
            className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[3/4] bg-stone-100">
              {g.cover_url ? (
                <Image
                  src={g.cover_url}
                  alt={g.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover transition group-hover:scale-[1.02]"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-xs text-stone-400">
                  No cover
                </div>
              )}
              <div className="absolute top-2 left-2">
                <ConsoleBadge value={g.console} />
              </div>
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-medium">{g.title}</div>
              <div className="mt-1 flex items-baseline justify-between text-xs">
                <span className="font-mono text-stone-900">
                  {formatUSD(g.current_market_price)}
                </span>
                <span className={`font-mono ${profitClass}`}>
                  {formatPercent(pct)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TableBody({
  rows, sortKey, sortDir, onToggleSort,
}: {
  rows: RetroGame[];
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
          <tr>
            <Th onClick={() => onToggleSort("title")} active={sortKey === "title"} dir={sortDir}>Title</Th>
            <Th onClick={() => onToggleSort("console")} active={sortKey === "console"} dir={sortDir}>Console</Th>
            <th className="px-3 py-2">Region</th>
            <th className="px-3 py-2">Cond.</th>
            <Th right onClick={() => onToggleSort("purchase_price")} active={sortKey === "purchase_price"} dir={sortDir}>Paid</Th>
            <Th right onClick={() => onToggleSort("current_market_price")} active={sortKey === "current_market_price"} dir={sortDir}>Market</Th>
            <Th right onClick={() => onToggleSort("profit")} active={sortKey === "profit"} dir={sortDir}>Profit</Th>
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
                        <Image src={g.cover_url} alt="" fill sizes="32px" className="object-cover" unoptimized />
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
        </tbody>
      </table>
    </div>
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
