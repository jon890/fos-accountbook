import { expect, test } from "./fixtures";

test("카테고리 목록을 표시한다", async ({ page }) => {
  await page.goto("/categories");

  for (const categoryName of ["식비", "교통", "생활"]) {
    await expect(page.getByText(categoryName, { exact: true })).toBeVisible();
  }
});

test("수입 탭에는 수입 카테고리만 표시한다", async ({ page }) => {
  await page.goto("/categories");

  await page.getByRole("tab", { name: "수입" }).click();

  await expect(page.getByText("급여", { exact: true })).toBeVisible();
  for (const categoryName of ["식비", "교통", "생활"]) {
    await expect(page.getByText(categoryName, { exact: true })).not.toBeVisible();
  }
});

test("폭별 주 콘텐츠 여백을 표시한다", async ({ page }, testInfo) => {
  await page.goto("/categories");

  const paddingLeft = await page.locator("main").evaluate((element) => getComputedStyle(element).paddingLeft);
  const expectedPadding = testInfo.project.name === "mobile" ? "12px" : "32px";
  expect(paddingLeft).toBe(expectedPadding);
});
