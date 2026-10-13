import { CATEGORY_PALETTE } from "./category-palette";

// 카테고리 화면 팔레트 8색 뒤에 어두운 변형 4색을 붙여 한 차트에서 12조각까지 겹치지 않게 한다.
const CHART_PALETTE: readonly string[] = [
  ...CATEGORY_PALETTE,
  "oklch(0.420 0.100 230)",
  "oklch(0.420 0.110 330)",
  "oklch(0.420 0.100 152)",
  "oklch(0.440 0.100 60)",
];

function normalizeColor(color: string): string {
  return color.trim().toLowerCase();
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
    const key = normalizeColor(item.color);
    if (key === "" || used.has(key)) continue;
    used.add(key);
    assigned.set(item.categoryUuid, item.color.trim());
  }

  let cursor = 0;
  for (const item of sorted) {
    if (assigned.has(item.categoryUuid)) continue;
    let tries = 0;
    while (tries < CHART_PALETTE.length && used.has(normalizeColor(CHART_PALETTE[cursor % CHART_PALETTE.length]))) {
      cursor += 1;
      tries += 1;
    }
    assigned.set(item.categoryUuid, CHART_PALETTE[cursor % CHART_PALETTE.length]);
    used.add(normalizeColor(CHART_PALETTE[cursor % CHART_PALETTE.length]));
    cursor += 1;
  }
  return assigned;
}
