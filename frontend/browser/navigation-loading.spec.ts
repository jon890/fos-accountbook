import { expect, test } from "./fixtures";
import { BACKEND_BASE_URL, FAMILY_UUID } from "./settings";

const delayMs = 1500;
const familyApiPath = `/api/v1/families/${FAMILY_UUID}`;

async function setDelay(
  request: import("@playwright/test").APIRequestContext,
  pathPrefix: string,
  ms: number,
) {
  const response = await request.post(`${BACKEND_BASE_URL}/__test/delay`, {
    data: { pathPrefix, ms },
  });
  expect(response.ok()).toBe(true);
}

test("수입 탭 전환 중 진행 막대와 목록 대기 상태를 표시한다", async ({ page, request }) => {
  await page.goto("/transactions");
  await expect(page.getByRole("tab", { name: "지출", selected: true })).toBeVisible();

  const membersPath = `${familyApiPath}/members`;
  await setDelay(request, membersPath, delayMs);

  try {
    await page.getByRole("tab", { name: "수입" }).click();

    await expect(page.getByRole("progressbar", { name: "화면을 불러오는 중" })).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(page.getByRole("tab", { name: "지출", exact: true })).toBeDisabled();
    await expect(page.getByRole("tab", { name: "수입", exact: true })).toBeDisabled();

    await expect(page).toHaveURL(/\/transactions\?.*tab=incomes/);
    await expect(page.getByRole("tab", { name: "수입", selected: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /10월 월급/ })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  } finally {
    await setDelay(request, membersPath, 0);
  }
});

test("다음 달 전환 중 진행 막대와 달력 대기 상태를 표시한다", async ({ page, request }) => {
  await page.goto("/calendar?month=2026-10");
  await expect(page.getByRole("heading", { name: /2026년 10월/ })).toBeVisible();

  const dailyStatsPath = `${familyApiPath}/dashboard/daily-stats`;
  await setDelay(request, dailyStatsPath, delayMs);

  try {
    await page.getByRole("button", { name: "다음 달" }).click();

    await expect(page.getByRole("progressbar", { name: "화면을 불러오는 중" })).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "이전 달" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "다음 달" })).toBeDisabled();

    await expect(page).toHaveURL(/\/calendar\?month=2026-11/);
    await expect(page.getByRole("heading", { name: /2026년 11월/ })).toBeVisible();
    // 예산 요약 카드의 사용률 막대도 progressbar 라서 화면 로딩 막대만 이름으로 가린다
    await expect(page.getByRole("progressbar", { name: "화면을 불러오는 중" })).toHaveCount(0);
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  } finally {
    await setDelay(request, dailyStatsPath, 0);
  }
});

test("달력에서 내역으로 이동할 때 목적 화면 스켈레톤을 표시한다", async ({ page, request }) => {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: /년.*월/ })).toBeVisible();

  const membersPath = `${familyApiPath}/members`;
  await setDelay(request, membersPath, delayMs);
  await page.route("**/transactions**", async (route) => {
    if (await route.request().headerValue("next-router-prefetch")) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  try {
    await page.getByRole("link", { name: "내역", exact: true }).click();

    await expect(page.locator(".ab-skel").first()).toBeVisible();
    await expect(page).toHaveURL(/\/transactions/);
    await expect(page.getByRole("tablist", { name: "거래 내역 탭" })).toBeVisible();
    await expect(page.getByRole("button", { name: /점심 식사/ })).toBeVisible();
  } finally {
    await setDelay(request, membersPath, 0);
  }
});

test("모바일 가족 전환 시트는 목록 요청 중 스켈레톤을 표시한다", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "가족 전환 시트는 모바일에서만 연다");

  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: /년.*월/ })).toBeVisible();

  await setDelay(request, "/api/v1/families", delayMs);

  try {
    await page.locator("header button").last().click();
    await page.getByRole("menuitem", { name: "가족 전환" }).click();

    await expect(page.getByRole("heading", { name: "가족 전환" })).toBeVisible();
    await expect(page.getByLabel("가족 목록을 불러오는 중").locator(".ab-skel")).toHaveCount(3);

    await expect(page.getByRole("button", { name: "브라우저 테스트 가족" })).toBeVisible();
  } finally {
    await setDelay(request, "/api/v1/families", 0);
  }
});
