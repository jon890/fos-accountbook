import { expect, test } from "./fixtures";
import { BACKEND_BASE_URL } from "./settings";

test("지출 행은 작성자와 날짜 링크를 보이고 한 번 눌러 수정 시트를 연다", async ({ page }, testInfo) => {
  await page.goto("/transactions");

  const row = page.getByRole("button", { name: /점심 식사/ });
  const categoryExcludedRow = page.getByRole("button", { name: /버스 요금/ });
  const regularExpenseRow = page.getByRole("button", { name: /세탁 세제/ });
  await expect(row).toContainText("식비");
  await expect(row).toContainText("민지");
  await expect(row.getByText("삭제", { exact: true })).toHaveCount(0);
  await expect(categoryExcludedRow).toContainText("예산 제외");
  await expect(regularExpenseRow.getByText("예산 제외", { exact: true })).toHaveCount(0);

  const details = row.locator("p.text-xs.text-fg-muted");
  const categoryDetail = details.locator(":scope > span").nth(0);
  const creatorDetail = details.locator(":scope > span").nth(1);
  const timeDetail = details.locator(":scope > span").nth(2);
  const budgetExcludedDetail = details.locator(":scope > span").nth(3);
  await expect(details).toHaveCount(1);

  const dateLink = page.locator('a[href^="/calendar?month="][href*="&date="]').first();
  await expect(dateLink).toHaveAttribute("href", /\/calendar\?month=\d{4}-\d{2}&date=\d{4}-\d{2}-\d{2}/);

  if (testInfo.project.name === "mobile") {
    await expect(categoryDetail).toBeVisible();
    await expect(creatorDetail).toBeVisible();
    await expect(timeDetail).toBeVisible();
    await expect(budgetExcludedDetail).toBeVisible();
    await expect(details).toHaveText(/^식비 · 민지 · \d{2}:\d{2} · 예산 제외$/);

    const rowBox = await row.boundingBox();
    expect(rowBox?.height).toBeGreaterThanOrEqual(56);
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
  } else {
    await expect(categoryDetail).toBeHidden();
    await expect(creatorDetail).toBeHidden();
    await expect(timeDetail).toBeVisible();
    await expect(budgetExcludedDetail).toBeVisible();
    expect(await details.innerText()).toMatch(/^\d{2}:\d{2} · 예산 제외$/);
  }

  await row.click();
  await expect(page.getByRole("heading", { name: "지출 수정" })).toBeVisible();
});

test("빈 지출과 수입 목록은 하단 가운데 추가 버튼 안내와 추가 시트를 표시한다", async ({ page, request }) => {
  const response = await request.post(`${BACKEND_BASE_URL}/__test/transactions`, {
    data: { empty: true },
  });
  expect(response.ok()).toBe(true);

  for (const tab of ["expenses", "incomes"]) {
    await page.goto(`/transactions?tab=${tab}`);
    await expect(
      page.getByRole("main").getByText("아래 가운데 + 버튼으로 거래를 추가해 보세요."),
    ).toBeVisible();

    await page.getByRole("button", { name: "거래 추가" }).click();
    await expect(page.getByRole("heading", { name: "거래 추가" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("수입 행을 누르면 수입 수정 시트가 열린다", async ({ page }) => {
  await page.goto("/transactions?tab=incomes");

  await page.getByRole("button", { name: /10월 월급/ }).click();
  await expect(page.getByRole("heading", { name: "수입 수정" })).toBeVisible();
});

test("더 보기는 300건을 더 요청하고 쪽 넘김 버튼을 표시하지 않는다", async ({ page, request }) => {
  const response = await request.post(`${BACKEND_BASE_URL}/__test/transactions-total`, {
    data: { totalElements: 4 },
  });
  expect(response.ok()).toBe(true);

  await page.goto("/transactions");
  await expect(page.getByRole("button", { name: "더 보기 (1건 남음)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이전" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "다음" })).toHaveCount(0);

  await page.getByRole("button", { name: "더 보기 (1건 남음)" }).click();
  await expect(page).toHaveURL(/limit=600/);

  const requestSizesResponse = await request.get(
    `${BACKEND_BASE_URL}/__test/transaction-request-sizes`,
  );
  expect(requestSizesResponse.ok()).toBe(true);
  expect(await requestSizesResponse.json()).toContain("600");
});

test("검색과 금액 범위는 받은 내역만 거르고 더 보기를 유지한다", async ({ page, request }) => {
  const response = await request.post(`${BACKEND_BASE_URL}/__test/transactions-total`, {
    data: { totalElements: 4 },
  });
  expect(response.ok()).toBe(true);

  await page.goto("/transactions?q=%EB%B2%84%EC%8A%A4");
  await expect(page.getByRole("button", { name: /버스 요금/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /점심 식사/ })).toHaveCount(0);
  await expect(page.getByText("불러온 3건 안에서 찾았어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "더 보기 (1건 남음)" })).toBeVisible();

  await page.goto("/transactions?q=%EC%8B%9D%EB%B9%84");
  await expect(page.getByRole("button", { name: /점심 식사/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /버스 요금/ })).toHaveCount(0);

  await page.goto("/transactions?amountMin=10000");
  await expect(page.getByRole("button", { name: /점심 식사/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /버스 요금/ })).toHaveCount(0);

  await page.goto("/transactions?q=%EC%97%86%EB%8A%94%20%EA%B2%80%EC%83%89%EC%96%B4");
  await expect(
    page.getByRole("main").getByText("조건에 맞는 거래가 없어요"),
  ).toBeVisible();
  const loadMoreButton = page.getByRole("button", { name: "더 보기 (1건 남음)" });
  await expect(loadMoreButton).toBeVisible();
  await loadMoreButton.click();
  await expect(page).toHaveURL(/limit=600/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("없는 검색어");
  await expect(
    page.getByRole("main").getByText("조건에 맞는 거래가 없어요"),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("불러온 3건 안에서 찾았어요"),
  ).toBeVisible();

  await page.goto("/transactions?tab=incomes&q=%EA%B8%89%EC%97%AC");
  await expect(page.getByRole("button", { name: /10월 월급/ })).toBeVisible();
});

test("3000건을 불러온 뒤에는 더 보기 대신 조회 기간 안내를 표시한다", async ({ page, request }) => {
  const response = await request.post(`${BACKEND_BASE_URL}/__test/transactions-total`, {
    data: { totalElements: 3001 },
  });
  expect(response.ok()).toBe(true);

  await page.goto("/transactions?limit=3000");

  await expect(page.getByRole("button", { name: /더 보기/ })).toHaveCount(0);
  await expect(
    page.getByText("최대 3000건까지 불러왔어요. 조회 기간을 줄여 주세요"),
  ).toBeVisible();
});

test("반복 행은 일정과 반영 상태를 보이고 수정 시트를 연다", async ({ page }) => {
  await page.goto("/transactions?tab=recurring");

  const row = page.getByRole("button", { name: /월세/ });
  await expect(row).toContainText("매월 25일");
  await expect(row).toContainText("이번 달 반영됨");
  await row.click();
  await expect(page.getByRole("heading", { name: "고정지출 수정" })).toBeVisible();
});

test("할부 탭은 요약과 진행 중, 완료 목록을 보이고 항목을 눌러 수정 창을 연다", async ({ page }) => {
  await page.goto("/transactions?tab=installments");

  await expect(page.getByRole("tab", { name: "할부" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("이번 달 할부")).toBeVisible();
  await expect(page.getByText("예산과 합계에는 포함되지 않아요")).toBeVisible();
  await expect(page.getByText("₩100,000", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("₩900,000", { exact: true }).first()).toBeVisible();

  const laptop = page.getByRole("button", { name: "노트북 할부 수정" });
  await expect(laptop).toContainText("3/12회");
  await expect(page.getByRole("heading", { name: "완료" })).toBeVisible();
  await expect(page.getByRole("button", { name: "청소기 할부 수정" })).toBeVisible();

  await laptop.click();
  await expect(page.getByRole("heading", { name: "할부 수정" })).toBeVisible();
  await expect(page.getByPlaceholder("예: 노트북")).toHaveValue("노트북");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "할부 추가" }).click();
  await expect(page.getByRole("heading", { name: "할부 추가" })).toBeVisible();
});

test("내역 탭은 추가 버튼 없이 하단 추가 시트를 연다", async ({ page }) => {
  for (const tab of ["expenses", "incomes", "recurring"]) {
    await page.goto(`/transactions?tab=${tab}`);
    await expect(page.getByRole("button", { name: "+ 지출 추가" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "수입 추가" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "고정지출 추가" })).toHaveCount(0);

    await page.getByRole("button", { name: "거래 추가" }).click();
    await expect(page.getByRole("heading", { name: "거래 추가" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});

test("모바일은 필터 버튼이 여는 하단 시트에서 필터를 적용하고 데스크톱은 칩을 보인다", async ({ page }, testInfo) => {
  await page.goto("/transactions");

  if (testInfo.project.name !== "mobile") {
    await expect(page.getByRole("button", { name: "필터", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "이번달", exact: true })).toBeVisible();
    return;
  }

  await expect(page.getByRole("button", { name: "이번달", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("filter-badge")).toHaveCount(0);

  await page.getByRole("button", { name: "필터", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  const viewport = page.viewportSize();
  await expect.poll(async () => {
    const box = await sheet.boundingBox();
    if (!box) {
      throw new Error("필터 시트의 위치를 확인할 수 없습니다");
    }
    return Math.round(box.y + box.height);
  }).toBe(viewport!.height);

  await sheet.getByRole("spinbutton", { name: "최솟값 금액" }).fill("10000");
  await sheet.getByRole("button", { name: "적용", exact: true }).click();

  await expect(page).toHaveURL(/amountMin=10000/);
  await expect(page.getByTestId("filter-badge")).toHaveText("1");
});
