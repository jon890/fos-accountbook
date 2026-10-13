import { CATEGORY_PALETTE } from "./category-palette";

// 카테고리 화면 팔레트 8색 뒤에 다크 값이 있는 토큰 4색을 붙여 한 차트에서 12조각까지 겹치지 않게 한다.
const CHART_PALETTE: readonly string[] = [
  ...CATEGORY_PALETTE,
  "var(--color-chart-extra-1)",
  "var(--color-chart-extra-2)",
  "var(--color-chart-extra-3)",
  "var(--color-chart-extra-4)",
];

const OKLCH_PATTERN = /^oklch\(\s*(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s*\)$/;

// 같은 색을 다른 숫자 표기(0.56 과 0.560)로 저장해도 같은 키가 나오게 한다. hex 와 oklch 사이는 비교하지 않는다.
function colorKey(color: string): string {
  const lowered = color.trim().toLowerCase();
  const match = OKLCH_PATTERN.exec(lowered);
  if (match === null) return lowered;
  return `oklch(${Number(match[1])} ${Number(match[2])} ${Number(match[3])})`;
}

/**
 * 차트 한 장 안에서 조각마다 다른 색을 배정한다. 키는 categoryUuid 다.
 * 저장 색을 금액 순서로 먼저 쓰고, 없거나 이미 쓴 색이면 쓰지 않은 팔레트 색을 금액 순서로 준다.
 */
export function getCategoryChartColors(
  items: ReadonlyArray<{ categoryUuid: string; color: string | null; totalAmount: number }>,
): Map<string, string> {
  const sorted = [...items].sort((a, b) => b.totalAmount - a.totalAmount);
  const assigned = new Map<string, string>();
  const used = new Set<string>();

  for (const item of sorted) {
    if (item.color === null) continue;
    const key = colorKey(item.color);
    if (key === "" || used.has(key)) continue;
    used.add(key);
    assigned.set(item.categoryUuid, item.color.trim());
  }

  let cursor = 0;
  for (const item of sorted) {
    if (assigned.has(item.categoryUuid)) continue;
    let tries = 0;
    while (tries < CHART_PALETTE.length && used.has(colorKey(CHART_PALETTE[cursor % CHART_PALETTE.length]))) {
      cursor += 1;
      tries += 1;
    }
    assigned.set(item.categoryUuid, CHART_PALETTE[cursor % CHART_PALETTE.length]);
    used.add(colorKey(CHART_PALETTE[cursor % CHART_PALETTE.length]));
    cursor += 1;
  }
  return assigned;
}
