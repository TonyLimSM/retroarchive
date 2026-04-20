import type { Console } from "@/lib/supabase/database.types";

const STYLES: Record<Console, string> = {
  PS2:     "bg-zinc-900 text-white",
  MD:      "bg-blue-700 text-white",
  Genesis: "bg-blue-500 text-white",
  Saturn:  "bg-orange-600 text-white",
  SFC:     "bg-rose-700 text-white",
  SNES:    "bg-violet-700 text-white",
  Switch:  "bg-red-600 text-white",
};

export function ConsoleBadge({ value }: { value: Console }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${STYLES[value]}`}
    >
      {value}
    </span>
  );
}
