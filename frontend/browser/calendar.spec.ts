import { expect, test } from "./fixtures";

test("달력은 지출과 카테고리의 예산 제외 상태를 행에 표시한다", async ({ page }) => {
  await page.goto("/calendar?month=2026-10&date=2026-10-01");

  const transactionBudgetExcluded = page.getByRole("button", { name: /점심 식사/ });
  const categoryBudgetExcluded = page.getByRole("button", { name: /버스 요금/ });
  const regularExpense = page.getByRole("button", { name: /세탁 세제/ });

  await expect(transactionBudgetExcluded).toContainText("예산 제외");
  await expect(categoryBudgetExcluded).toContainText("예산 제외");
  await expect(regularExpense.getByText("예산 제외", { exact: true })).toHaveCount(0);
});
