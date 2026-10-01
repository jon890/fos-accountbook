import { expect, test } from "./fixtures";

test.use({ colorScheme: "dark" });

test("모바일 내역의 카테고리별 지출 박스는 접혀 있고 행을 압축해 표시한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/transactions");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const summary = page.getByText("카테고리별 지출", { exact: true })
    .locator("xpath=ancestor::*[@data-slot='card']")
    .first();
  await expect(summary).toBeVisible();

  const collapsedHeight = await summary.evaluate((element) => element.getBoundingClientRect().height);
  expect(collapsedHeight).toBeLessThanOrEqual(120);

  await page.getByRole("button", { name: /카테고리별 지출/ }).click();
  const categoryRow = summary.getByRole("button", { name: /식비/ });
  await expect(categoryRow).toBeVisible();

  const rowHeight = await categoryRow.evaluate((element) => element.getBoundingClientRect().height);
  expect(rowHeight).toBeLessThanOrEqual(56);

  const background = await summary.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(colorLightness(background)).toBeLessThan(0.45);
});

function colorLightness(color: string): number {
  const oklch = color.match(/^oklch\(([-+]?\d*\.?\d+)/);
  if (oklch) return Number(oklch[1]);

  const oklab = color.match(/^oklab\(([-+]?\d*\.?\d+)/);
  if (oklab) return Number(oklab[1]);

  const lab = color.match(/^lab\(([-+]?\d*\.?\d+)/);
  if (lab) return Number(lab[1]) / 100;

  const rgb = color.match(/^rgba?\(([^)]+)\)$/);
  if (!rgb) throw new Error(`지원하지 않는 계산 색상: ${color}`);

  const [red, green, blue] = rgb[1]
    .split(",")
    .slice(0, 3)
    .map((value) => Number(value.trim()) / 255);
  const linear = [red, green, blue].map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
