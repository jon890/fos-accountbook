import { expect, test } from "./fixtures";

async function expectNonWhiteBackground(locator: import("@playwright/test").Locator) {
  await expect(locator).toBeVisible();
  expect(
    await locator.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe("rgb(255, 255, 255)");
}

test("다크 테마에서 거래 추가 표면과 고정지출 강조를 표시한다", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/transactions");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const addTransactionButton = page.getByRole("button", { name: "거래 추가" });
  await expect(addTransactionButton).toBeVisible();
  await addTransactionButton.click();

  if (testInfo.project.name === "mobile") {
    expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expectNonWhiteBackground(sheet);
    await expect(page.getByRole("heading", { name: "거래 추가" })).toBeVisible();
  } else {
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expectNonWhiteBackground(dialog);
    await expect(page.getByRole("heading", { name: "거래 추가" })).toBeVisible();
  }

  const recurringTypeRadio = page.getByRole("radio", { name: "고정지출", exact: true });
  await recurringTypeRadio.click();
  await expect(recurringTypeRadio).toHaveClass(/gradient-primary/);
  await expect(recurringTypeRadio).toHaveClass(/text-brand-fg/);

  const submitButton = page.getByRole("button", { name: "고정지출 추가" });
  await expect(submitButton).toHaveClass(/gradient-primary/);
  await expect(submitButton).toHaveClass(/text-brand-fg/);

  await page.keyboard.press("Escape");
  await page.goto("/categories");
  await page.getByRole("button", { name: "카테고리 추가" }).click();
  await expectNonWhiteBackground(page.locator('[data-slot="dialog-content"]'));
});

test("예산 제외 스위치는 가로로 긴 막대로 표시하고 터치 영역은 44px 을 유지한다", async ({ page }) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "거래 추가" }).click();

  const toggle = page.getByRole("switch", { name: "예산에서 제외" });
  await toggle.scrollIntoViewIfNeeded();
  const toggleBox = await toggle.boundingBox();
  const trackBox = await toggle.locator('[data-slot="switch-track"]').boundingBox();
  if (!toggleBox || !trackBox) {
    throw new Error("switch bounding box is unavailable");
  }

  expect(toggleBox.height).toBeGreaterThanOrEqual(44);
  expect(trackBox.width).toBeGreaterThan(trackBox.height * 1.5);
});
