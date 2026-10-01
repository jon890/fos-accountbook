import { expect, test } from "./fixtures";

test("지출 행은 작성자와 날짜 링크를 보이고 한 번 눌러 수정 시트를 연다", async ({ page }, testInfo) => {
  await page.goto("/transactions");

  const row = page.getByRole("button", { name: /점심 식사/ });
  await expect(row).toContainText("민지");
  await expect(row.getByText("삭제", { exact: true })).toHaveCount(0);

  const dateLink = page.locator('a[href^="/calendar?month="][href*="&date="]').first();
  await expect(dateLink).toHaveAttribute("href", /\/calendar\?month=\d{4}-\d{2}&date=\d{4}-\d{2}-\d{2}/);

  if (testInfo.project.name === "mobile") {
    const rowBox = await row.boundingBox();
    expect(rowBox?.height).toBeGreaterThanOrEqual(56);
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await row.click();
  await expect(page.getByRole("heading", { name: "지출 수정" })).toBeVisible();
});

test("수입 행을 누르면 수입 수정 시트가 열린다", async ({ page }) => {
  await page.goto("/transactions?tab=incomes");

  await page.getByRole("button", { name: /급여/ }).click();
  await expect(page.getByRole("heading", { name: "수입 수정" })).toBeVisible();
});

test("반복 행은 일정과 반영 상태를 보이고 수정 시트를 연다", async ({ page }) => {
  await page.goto("/transactions?tab=recurring");

  const row = page.getByRole("button", { name: /월세/ });
  await expect(row).toContainText("매월 25일");
  await expect(row).toContainText("이번 달 반영됨");
  await row.click();
  await expect(page.getByRole("heading", { name: "고정지출 수정" })).toBeVisible();
});

test("내역 탭은 추가 버튼 없이 하단 추가 시트를 연다", async ({ page }) => {
  for (const tab of ["expenses", "incomes", "recurring"]) {
    await page.goto(`/transactions?tab=${tab}`);
    await expect(page.getByRole("button", { name: "+ 지출 추가" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "수입 추가" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "고정지출 추가" })).toHaveCount(0);

    await page.getByRole("button", { name: "지출 추가" }).click();
    await expect(page.getByRole("heading", { name: "거래 추가" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
