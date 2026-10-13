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
