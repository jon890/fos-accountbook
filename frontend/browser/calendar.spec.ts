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

test("달력 위쪽에 생활비와 예산 항목의 쓴 금액과 한도를 보인다", async ({ page }) => {
  await page.goto("/calendar?month=2026-10&date=2026-10-01");

  const summary = page.getByRole("link", { name: "예산 요약, 예산 화면으로 이동" });

  await expect(summary).toContainText("예산");
  await expect(summary).toContainText("생활비");
  await expect(summary).toContainText("용돈");
  await expect(summary).toContainText("₩150,000");
});

test("달력 위쪽에 구성원 색 범례를 금액 없이 보인다", async ({ page }) => {
  await page.goto("/calendar?month=2026-10&date=2026-10-01");

  const legend = page.getByRole("list", { name: "구성원 색상" });

  await expect(legend).toBeVisible();
  await expect(legend).toContainText("민지");
  await expect(legend).not.toContainText("₩16,200");
  await expect(legend).not.toContainText("₩3,000,000");
});

test("날짜를 누르면 가려진 날짜 목록 제목까지 스크롤하고 포커스를 준다", async ({ page }) => {
  await page.goto("/calendar?month=2026-10&date=2026-10-01");
  const heading = page.getByRole("heading", { level: 2, name: /^10월 1일/ });
  await expect(heading).toBeVisible();
  const scrollBefore = await page.evaluate(() => window.scrollY);

  await page.getByRole("button", { name: /^10월 20일/ }).click();

  const selected = page.getByRole("heading", { level: 2, name: /^10월 20일/ });
  await expect(selected).toBeFocused();
  const headerBottom = await page.locator("header").first().evaluate((el) => el.getBoundingClientRect().bottom);
  const viewportHeight = page.viewportSize()!.height;
  // 부드러운 스크롤이 끝날 때까지 기다린 뒤, 제목이 헤더 아래와 화면 안에 들어왔는지 본다
  await expect
    .poll(async () => {
      const box = await selected.boundingBox();
      return box !== null && box.y >= headerBottom && box.y + box.height <= viewportHeight;
    })
    .toBe(true);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore);
});

test("날짜 목록 제목이 이미 다 보이면 스크롤하지 않고 포커스만 준다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "제목이 처음부터 보이는 큰 화면에서 한 번만 확인한다");
  await page.setViewportSize({ width: 1280, height: 1800 });
  // 부드러운 스크롤은 다음 프레임부터 움직여 잘못 스크롤해도 바로는 0 이다. 즉시 이동하게 해 판정을 확실히 한다
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calendar?month=2026-10&date=2026-10-01");
  await expect(page.getByRole("heading", { level: 2, name: /^10월 1일/ })).toBeVisible();

  await page.getByRole("button", { name: /^10월 20일/ }).click();

  await expect(page.getByRole("heading", { level: 2, name: /^10월 20일/ })).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
