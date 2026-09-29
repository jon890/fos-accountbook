// 6-month trend data (illustrative, for landing page preview only)
const TREND = [
  { amt: 2180000 },
  { amt: 2420000 },
  { amt: 1980000 },
  { amt: 2150000 },
  { amt: 2310000 },
  { amt: 1990000 },
];

// Donut segments — top 5 category proportions (illustrative)
const DONUT_SEGMENTS = [
  { pct: 0.314 }, // 식비
  { pct: 0.245 }, // 주거
  { pct: 0.157 }, // 쇼핑
  { pct: 0.099 }, // 교통
  { pct: 0.185 }, // 기타
];

const DONUT_COLORS = [
  "var(--color-brand-500)",
  "var(--color-brand-300)",
  "var(--color-brand-100)",
  "var(--color-brand-200)",
  "var(--color-brand-400)",
];

export function MiniDonut({ size = 64 }: { size?: number }) {
  const thickness = size * 0.28;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  // Pre-compute cumulative offsets so no variable mutation occurs inside JSX render
  const offsets = DONUT_SEGMENTS.reduce<number[]>((acc, seg, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + DONUT_SEGMENTS[i - 1].pct);
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {DONUT_SEGMENTS.map((seg, i) => {
        const dash = seg.pct * circumference;
        const gap = circumference - dash;
        const rotate = offsets[i] * 360;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={DONUT_COLORS[i]}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rotate - 90} ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}

export function MiniBars({ w = 90, h = 44 }: { w?: number; h?: number }) {
  const max = Math.max(...TREND.map((t) => t.amt));
  const count = TREND.length;
  const gap = 4;
  const bw = (w - gap * (count - 1)) / count;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {TREND.map((t, i) => {
        const bh = (t.amt / max) * (h - 4);
        const cur = i === count - 1;
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={h - bh}
            width={bw}
            height={bh}
            rx={2}
            fill={cur ? "var(--color-brand-500)" : "var(--color-brand-100)"}
          />
        );
      })}
    </svg>
  );
}
