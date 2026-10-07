import { expect, test } from "./fixtures";

test("카테고리 목록을 표시한다", async ({ page }) => {
  await page.goto("/categories");

  for (const categoryName of ["식비", "교통", "생활"]) {
    await expect(page.getByText(categoryName, { exact: true })).toBeVisible();
  }
});

test("수입 탭에는 수입 카테고리만 표시한다", async ({ page }) => {
  await page.goto("/categories");

  await page.getByRole("tab", { name: "수입" }).click();

  await expect(page.getByText("급여", { exact: true })).toBeVisible();
  for (const categoryName of ["식비", "교통", "생활"]) {
    await expect(page.getByText(categoryName, { exact: true })).not.toBeVisible();
  }
});

test("모바일에서도 예산 제외 카테고리의 글자를 표시한다", async ({ page }) => {
  await page.goto("/categories");

  const excludedCategory = page.locator('[data-slot="card"]', { hasText: "교통" });
  await expect(excludedCategory.getByText("예산 제외", { exact: true })).toBeVisible();
});

test("폭별 주 콘텐츠 여백을 표시한다", async ({ page }, testInfo) => {
  await page.goto("/categories");

  const paddingLeft = await page.locator("main").evaluate((element) => getComputedStyle(element).paddingLeft);
  const expectedPadding = testInfo.project.name === "mobile" ? "12px" : "32px";
  expect(paddingLeft).toBe(expectedPadding);
});

test("모바일 카테고리 추가 시트는 하단에 붙고 이모지를 8열로 표시한다", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/categories");
  await page.getByRole("button", { name: "카테고리 추가" }).click();

  if (testInfo.project.name === "mobile") {
    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();
    expect(page.viewportSize()).toEqual({ width: 390, height: 844 });

    await expect.poll(async () => {
      const sheetBox = await sheet.boundingBox();
      if (!sheetBox) {
        throw new Error("카테고리 시트의 위치를 확인할 수 없습니다");
      }
      return Math.round(sheetBox.y + sheetBox.height);
    }).toBe(844);

    const emojiGrid = page.locator('[aria-label$="아이콘 선택"]').first().locator("..");
    const emojiButtons = emojiGrid.getByRole("button");
    expect(await emojiButtons.count()).toBeGreaterThanOrEqual(8);
    const firstRow = await Promise.all(
      Array.from({ length: 8 }, (_, index) => emojiButtons.nth(index).boundingBox()),
    );
    const firstRowBoxes = firstRow.filter(
      (box): box is NonNullable<typeof box> => box !== null,
    );
    expect(firstRowBoxes).toHaveLength(8);
    expect(new Set(firstRowBoxes.map((box) => Math.round(box!.y))).size).toBe(1);
    for (const box of firstRowBoxes) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    const ninthBox = await emojiButtons.nth(8).boundingBox();
    if (!ninthBox) {
      throw new Error("아홉 번째 이모지의 위치를 확인할 수 없습니다");
    }
    expect(Math.round(ninthBox.y)).toBeGreaterThan(Math.round(firstRowBoxes[0]!.y));
    expect(
      await emojiGrid.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    expect(await sheet.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe("rgb(255, 255, 255)");

    await page.screenshot({
      path: testInfo.outputPath("category-sheet-390.png"),
      fullPage: true,
    });
  } else {
    await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  }
});
