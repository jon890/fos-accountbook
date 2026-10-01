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

  const recurringTypeButton = page.getByRole("button", { name: "고정지출", exact: true });
  await recurringTypeButton.click();
  await expect(recurringTypeButton).toHaveClass(/gradient-primary/);
  await expect(recurringTypeButton).toHaveClass(/text-brand-fg/);

  const submitButton = page.getByRole("button", { name: "고정지출 추가" });
  await expect(submitButton).toHaveClass(/gradient-primary/);
  await expect(submitButton).toHaveClass(/text-brand-fg/);

  await page.keyboard.press("Escape");
  await page.goto("/categories");
  await page.getByRole("button", { name: "카테고리 추가" }).click();
  await expectNonWhiteBackground(page.locator('[data-slot="dialog-content"]'));
});
