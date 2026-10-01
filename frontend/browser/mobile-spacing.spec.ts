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
