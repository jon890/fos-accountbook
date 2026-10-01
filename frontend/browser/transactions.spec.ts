import { expect, test } from "./fixtures";

test("지출 행은 작성자와 날짜 링크를 보이고 한 번 눌러 수정 시트를 연다", async ({ page }, testInfo) => {
  await page.goto("/transactions");

  const row = page.getByRole("button", { name: /점심 식사/ });
  await expect(row).toContainText("민지");
  await expect(row.getByText("삭제", { exact: true })).toHaveCount(0);

  const dateLink = page.locator('a[href^="/calendar?month="][href*="&date="]').first();
  await expect(dateLink).toHaveAttribute("href", /\/calendar\?month=\d{4}-\d{2}&date=\d{4}-\d{2}-\d{2}/);

  await row.click();
  await expect(page.getByRole("heading", { name: "지출 수정" })).toBeVisible();

  if (testInfo.project.name === "mobile") {
    await expect(page.getByRole("heading", { name: "지출 수정" })).toBeVisible();
  }
});

test("수입 행을 누르면 수입 수정 시트가 열린다", async ({ page }) => {
  await page.goto("/transactions?tab=incomes");

  await page.getByRole("button", { name: /급여/ }).click();
  await expect(page.getByRole("heading", { name: "수입 수정" })).toBeVisible();
});
