import { expect, test } from "./fixtures";

test("알림 목록을 표시한다", async ({ page }) => {
  await page.goto("/notifications");

  await expect(page.getByText("식비 예산이 80%를 넘었습니다")).toBeVisible();
  await expect(page.getByText("교통비 예산 사용 현황")).toBeVisible();
});

test("세션이 없으면 알림 화면을 열 수 없다", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/notifications");
  await expect(page).toHaveURL(/\/(?:$|auth\/signin)/);

  await context.close();
});
