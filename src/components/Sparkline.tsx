import { formatUSD } from "@/lib/format";

export type PricePoint = {
  price: number;
  recorded_at: string;
};

type Props = {
  points: PricePoint[];
  width?: number;
  height?: number;
  strokeWidth?: number;
};

/**
 * Minimal sparkline: pure SVG, no charting library.
 *
 * - Handles 0, 1, and N points gracefully
 * - Line color reflects trend direction (green up, red down, neutral flat)
 * - Last point is drawn as a filled dot
 * - Tooltip shows current vs. first price + delta %
 */
export function Sparkline({
  points,
  width = 120,
  height = 40,
  strokeWidth = 1.5,
}: Props) {
  if (points.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-[10px] text-stone-400"
      >
        no history
      </div>
    );
  }

  // Sort oldest → newest to draw left-to-right.
  const sorted = [...points].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  const prices = sorted.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1); // avoid /0 on flat lines
  const first = prices[0];
  const last = prices[prices.length - 1];
  const delta = last - first;
  const deltaPct = first === 0 ? 0 : (delta / first) * 100;

  // Map each point into SVG coordinates with 2px margin so the dot isn't clipped.
  const M = 2;
  const xStep = sorted.length > 1 ? (width - 2 * M) / (sorted.length - 1) : 0;
  const coords = prices.map((p, i) => {
    const x = M + i * xStep;
    const y = M + (height - 2 * M) * (1 - (p - min) / range);
    return [x, y] as const;
  });
  const path = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  const color =
    delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-stone-400";
  const title =
    `${formatUSD(first)} → ${formatUSD(last)} ` +
    `(${delta >= 0 ? "+" : ""}${deltaPct.toFixed(0)}% over ${sorted.length} data point${sorted.length === 1 ? "" : "s"})`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={color}
      aria-label={title}
    >
      <title>{title}</title>
      {sorted.length > 1 && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
    </svg>
  );
}
