import { expect, test } from "./fixtures";
import { BACKEND_BASE_URL } from "./settings";

test("알림 목록을 표시한다", async ({ page }) => {
  await page.goto("/notifications");

  await expect(page.getByText("식비 예산이 80%를 넘었습니다")).toBeVisible();
  await expect(page.getByText("교통비 예산 사용 현황")).toBeVisible();
});

test("세션이 없으면 알림 화면을 열 수 없다", async ({ browser }) => {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/(?:$|auth\/signin)/);
  } finally {
    await context.close();
  }
});

test("알림이 많아도 알림 창 목록이 카드 안에서 스크롤된다", async ({ page, request }) => {
  const response = await request.post(`${BACKEND_BASE_URL}/__test/notifications-count`, {
    data: { extra: 12 },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto("/calendar");
  await page.getByRole("button", { name: /^알림/ }).click();

  const popover = page.locator('[data-slot="popover-content"]');
  await expect(popover.getByText("추가 알림 1", { exact: true })).toBeVisible();

  const { popoverBottom, lastItemBottom, viewportHeight } = await popover.evaluate((element) => {
    const items = element.querySelectorAll('[data-slot="notification-list"] > *');
    const last = items[items.length - 1];
    return {
      popoverBottom: element.getBoundingClientRect().bottom,
      lastItemBottom: last.getBoundingClientRect().bottom,
      viewportHeight: window.innerHeight,
    };
  });

  // 카드는 화면 안에 들어오고, 목록은 카드 아래로 넘쳐 그려지지 않고 잘린 채 스크롤된다.
  expect(popoverBottom).toBeLessThanOrEqual(viewportHeight);
  await expect(page.getByRole("link", { name: "전체 보기 →" })).toBeInViewport();
  expect(lastItemBottom).toBeGreaterThan(popoverBottom);
  const lastItemVisible = await popover.evaluate((element) => {
    const items = element.querySelectorAll('[data-slot="notification-list"] > *');
    const last = items[items.length - 1].getBoundingClientRect();
    const hit = document.elementFromPoint(last.left + 10, Math.min(last.top + 10, window.innerHeight - 1));
    return element.contains(hit);
  });
  expect(lastItemVisible).toBe(false);

  // 「전체 보기」 위에 목록이 겹쳐 그려지지 않는다.
  const footerOnTop = await page.getByRole("link", { name: "전체 보기 →" }).evaluate((link) => {
    const box = link.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return link === hit || link.contains(hit);
  });
  expect(footerOnTop).toBe(true);
});
