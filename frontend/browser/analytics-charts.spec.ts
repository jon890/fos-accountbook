import { expect, test } from "./fixtures";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
]) {
  test(`${viewport.width}px 분석 화면의 월별 추이 막대가 실제 높이를 갖는다`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/analytics?period=m3");

    const bars = page.locator('[aria-label*="월 지출"]');
    await expect(bars).toHaveCount(3);

    const heights = await bars.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height),
    );
    for (const height of heights) {
      expect(height).toBeGreaterThanOrEqual(8);
    }
    expect(heights[2]).toBeGreaterThan(heights[0]);
    expect(heights[2]).toBeGreaterThan(heights[1]);
    expect(heights[2]).toBeGreaterThanOrEqual(40);
  });
}

test("분석 도넛 조각은 서로 다른 색이고 범례 점은 회색이 아니다", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/analytics");

  const sectors = page.locator(".recharts-pie-sector path");
  await expect(sectors).toHaveCount(3);
  const fills = await sectors.evaluateAll((elements) => elements.map((element) => element.getAttribute("fill")));
  expect(new Set(fills).size).toBe(3);

  const legendDot = page.getByText("생활", { exact: true }).first().locator("xpath=preceding-sibling::span[1]");
  const background = await legendDot.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(colorChroma(background)).toBeGreaterThan(0.05);
});

function colorChroma(color: string): number {
  const oklch = color.match(/^oklch\(\s*[-+]?\d*\.?\d+\s+([-+]?\d*\.?\d+)/);
  if (oklch) return Number(oklch[1]);

  const oklab = color.match(/^oklab\(\s*[-+]?\d*\.?\d+\s+([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)/);
  if (oklab) return Math.hypot(Number(oklab[1]), Number(oklab[2]));

  throw new Error(`지원하지 않는 계산 색상: ${color}`);
}
