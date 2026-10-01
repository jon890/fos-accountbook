import { BACKEND_BASE_URL } from "./settings";
import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

function expectedSpacing(projectName: string) {
  const isMobile = projectName === "mobile";

  return {
    alertDialogWidth: isMobile ? 358 : 512,
    cardContentPadding: isMobile ? "12px" : "16px",
    dialogPadding: isMobile ? "16px" : "24px",
    emptyState: {
      icon: isMobile ? "32px" : "48px",
      iconCircle: isMobile ? "64px" : "96px",
      paddingBottom: isMobile ? "24px" : "40px",
      paddingLeft: isMobile ? "16px" : "24px",
      paddingTop: isMobile ? "32px" : "52px",
    },
    heroPaddingLeft: isMobile ? "16px" : "24px",
    notificationItemPaddingTop: isMobile ? "12px" : "16px",
  };
}

async function computedStyles(locator: Locator) {
  return locator.evaluate((element: Element) => {
    const styles = getComputedStyle(element);
    return {
      borderRadius: styles.borderRadius,
      maxWidth: styles.maxWidth,
      paddingBottom: styles.paddingBottom,
      paddingLeft: styles.paddingLeft,
      paddingTop: styles.paddingTop,
    };
  });
}

test("카드와 다이얼로그의 폭별 안쪽 여백을 표시한다", async ({ page }, testInfo) => {
  const expected = expectedSpacing(testInfo.project.name);
  await page.goto("/categories");

  const firstCard = page.locator('[data-slot="card"]').first();
  await expect(firstCard).toBeVisible();
  expect(await firstCard.evaluate((element) => getComputedStyle(element).paddingTop)).toBe("0px");

  const categoryCard = page.locator('[data-slot="card"]', { hasText: "식비" });
  const categoryContent = categoryCard.locator('[data-slot="card-content"]');
  await expect(categoryContent).toBeVisible();
  expect(await categoryContent.evaluate((element) => getComputedStyle(element).paddingTop)).toBe(
    expected.cardContentPadding,
  );

  await page.getByRole("button", { name: "카테고리 추가" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  expect((await computedStyles(dialog)).paddingTop).toBe(expected.dialogPadding);
  await page.getByRole("button", { name: "Close" }).click();

  await categoryCard.getByRole("button").nth(1).click();
  const alertDialog = page.getByRole("alertdialog");
  await expect(alertDialog).toBeVisible();
  const alertDialogStyles = await computedStyles(alertDialog);
  expect(alertDialogStyles.paddingTop).toBe(expected.dialogPadding);
  const alertDialogBox = await alertDialog.boundingBox();
  if (!alertDialogBox) {
    throw new Error("AlertDialog bounding box is unavailable");
  }
  expect(alertDialogBox.width).toBe(expected.alertDialogWidth);
  expect(alertDialogStyles.borderRadius).toBe("16px");
});

test("빈 카테고리 상태의 폭별 여백과 아이콘 크기를 표시한다", async ({ page, request }, testInfo) => {
  const expected = expectedSpacing(testInfo.project.name).emptyState;
  const response = await request.post(`${BACKEND_BASE_URL}/__test/categories`, {
    data: { empty: true },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto("/categories");
  const emptyState = page.getByText("등록된 카테고리가 없습니다").locator("..");
  await expect(emptyState).toBeVisible();
  const emptyStateStyles = await computedStyles(emptyState);
  expect(emptyStateStyles.paddingLeft).toBe(expected.paddingLeft);
  expect(emptyStateStyles.paddingTop).toBe(expected.paddingTop);
  expect(emptyStateStyles.paddingBottom).toBe(expected.paddingBottom);

  const iconCircle = emptyState.locator(":scope > div").first();
  const icon = iconCircle.locator("svg");
  await expect(icon).toBeVisible();
  expect(await iconCircle.evaluate((element) => getComputedStyle(element).width)).toBe(expected.iconCircle);
  expect(await icon.evaluate((element) => getComputedStyle(element).width)).toBe(expected.icon);
});

test("카테고리의 바깥 여백을 폭별로 표시한다", async ({ page }, testInfo) => {
  await page.goto("/categories");

  const firstCard = page.locator('[data-slot="card"]').first();
  await expect(firstCard).toBeVisible();
  const firstCardBox = await firstCard.boundingBox();
  if (!firstCardBox) {
    throw new Error("Category card bounding box is unavailable");
  }

  if (testInfo.project.name === "mobile") {
    expect(firstCardBox.x).toBe(12);
  } else {
    const mainPaddingLeft = await page.locator("main").evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingLeft),
    );
    expect(firstCardBox.x).toBe(208);
    expect(firstCardBox.x).toBeGreaterThanOrEqual(mainPaddingLeft);
  }
});

test("알림 항목과 카테고리 히어로의 폭별 안쪽 여백을 표시한다", async ({ page }, testInfo) => {
  const expected = expectedSpacing(testInfo.project.name);

  await page.goto("/notifications");
  const firstNotificationItem = page.getByRole("button", { name: /식비 예산이 80%를 넘었습니다/ });
  await expect(firstNotificationItem).toBeVisible();
  expect(await firstNotificationItem.evaluate((element) => getComputedStyle(element).paddingTop)).toBe(
    expected.notificationItemPaddingTop,
  );

  await page.goto("/categories");
  const hero = page
    .getByRole("main")
    .locator('[data-slot="card"]', { hasText: "카테고리 관리" });
  await expect(hero).toHaveCount(1);
  const heroContent = hero.locator(":scope > div");
  await expect(heroContent).toBeVisible();
  expect(await heroContent.evaluate((element) => getComputedStyle(element).paddingLeft)).toBe(
    expected.heroPaddingLeft,
  );
});

test("클라이언트 탐색 중 알림의 바깥 여백을 표시한다", async ({ page, request }, testInfo) => {
  const isMobile = testInfo.project.name === "mobile";
  const expectedOuterX = isMobile ? 12 : 304;
  const expectedListX = isMobile ? 12 : 328;

  const holdResponse = await request.post(`${BACKEND_BASE_URL}/__test/notifications-delay`, {
    data: { hold: true },
  });
  expect(holdResponse.ok()).toBeTruthy();

  await page.route("**/notifications**", async (route) => {
    const prefetchHeader = await route.request().headerValue("next-router-prefetch");
    if (prefetchHeader) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto("/menu");
  await expect(page.getByRole("link", { name: "알림", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "알림", exact: true }).click();

  const notificationsLoading = page.locator("main > div").filter({
    has: page.locator(".ab-skel"),
  });
  await expect(notificationsLoading).toBeVisible();
  const loadingBox = await notificationsLoading.boundingBox();
  if (!loadingBox) {
    throw new Error("Notifications loading bounding box is unavailable");
  }
  expect(loadingBox.x).toBe(expectedOuterX);

  const releaseResponse = await request.post(`${BACKEND_BASE_URL}/__test/notifications-delay`, {
    data: { hold: false },
  });
  expect(releaseResponse.ok()).toBeTruthy();

  const notificationList = page.locator(".divide-y.divide-border.rounded-xl");
  await expect(notificationList).toBeVisible();
  const notificationsClient = notificationList.locator("..");
  const notificationsClientBox = await notificationsClient.boundingBox();
  if (!notificationsClientBox) {
    throw new Error("Notifications client bounding box is unavailable");
  }
  expect(notificationsClientBox.x).toBe(expectedOuterX);
  const notificationListBox = await notificationList.boundingBox();
  if (!notificationListBox) {
    throw new Error("Notifications list bounding box is unavailable");
  }
  expect(notificationListBox.x).toBe(expectedListX);
});
