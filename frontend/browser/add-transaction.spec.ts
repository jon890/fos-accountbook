import { BACKEND_BASE_URL } from "./settings";
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

test("모바일 숫자패드와 데스크톱 직접 입력은 금액을 저장한다", async ({ page, request }, testInfo) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "거래 추가" }).click();

  const amountInput = page.locator('input[aria-label="금액 직접 입력"]');
  const amountDisplay = page.getByLabel("금액 0원");
  await amountDisplay.click();
  if (testInfo.project.name === "mobile") {
    await expect(amountInput).not.toBeFocused();
    await expect(amountInput).toHaveAttribute("inputmode", "none");
    await expect(amountInput).toHaveAttribute("readonly", "");

    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "영영" }).click();
    await expect(page.getByLabel("금액 1,200원")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("amount-keypad-390.png"),
      fullPage: true,
    });
  } else {
    await expect(amountInput).toBeFocused();
    await expect(amountInput).toHaveAttribute("inputmode", "numeric");
    await expect(page.getByRole("button", { name: "영영" })).toHaveCount(0);
    await page.keyboard.type("1200");
    await expect(page.getByLabel("금액 1,200원")).toBeVisible();
  }

  const foodCategory = page.getByRole("radio", { name: "식비" });
  await foodCategory.click();
  await expect(foodCategory).toHaveAttribute("aria-checked", "true");

  const submitButton = page.getByRole("button", { name: "지출 추가" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(page.getByRole("heading", { name: "거래 추가" })).toHaveCount(0);
  const createdTransactionsResponse = await request.get(
    `${BACKEND_BASE_URL}/__test/created-transactions`,
  );
  expect(createdTransactionsResponse.ok()).toBe(true);
  expect(await createdTransactionsResponse.json()).toEqual([
    expect.objectContaining({
      path: "/api/v1/families/11111111-1111-1111-1111-111111111111/expenses",
      body: expect.objectContaining({ amount: 1200 }),
    }),
  ]);
});

test("수정 창에서 빈 금액 안내가 카테고리 선택을 가리지 않는다", async ({ page }, testInfo) => {
  await page.goto("/transactions");
  await page.getByRole("button", { name: /점심 식사/ }).click();
  await expect(page.getByRole("heading", { name: "지출 수정" })).toBeVisible();

  const amountInput = page.locator('input[aria-label="금액 직접 입력"]');
  if (testInfo.project.name === "mobile") {
    const deleteButton = page.getByRole("button", { name: "지우기" });
    for (let index = 0; index < 5; index += 1) {
      await deleteButton.click();
    }
  } else {
    await page.getByLabel("금액 12,500원").click();
    await expect(amountInput).toBeFocused();
    await amountInput.fill("");
  }

  await expect(page.getByText("금액을 입력해 주세요")).toBeVisible();
  const transitCategory = page.getByRole("radio", { name: "교통 예산 제외" });
  await transitCategory.click();
  await expect(transitCategory).toHaveAttribute("aria-checked", "true");
});
