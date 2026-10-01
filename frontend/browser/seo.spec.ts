import { expect, test } from "./fixtures";
import { WEB_BASE_URL } from "./settings";

const invitationToken = "55555555-5555-4555-8555-555555555555";
const privatePaths = [
  "/calendar",
  "/transactions",
  "/analytics",
  "/budget",
  "/categories",
  "/notifications",
  "/settings",
  "/menu",
  "/families",
  "/invite",
  "/api",
  "/dashboard",
  "/expenses",
  "/auth/error",
  "/auth/signout",
];

test("랜딩에서 서비스 메타데이터를 제공한다", async ({ browser }) => {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    await page.goto("/");

    await expect(page).toHaveTitle("우리집 가계부 — 가족과 함께 쓰는 가계부");
    await expect(page).not.toHaveTitle(/fos-accountbook/);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "우리집 가계부",
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "ko_KR",
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      WEB_BASE_URL,
    );
  } finally {
    await context.close();
  }
});

test("인증된 화면과 비공개 인증 화면을 검색에서 제외한다", async ({ page }) => {
  await page.goto("/categories");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );

  await page.goto(`/invite/${invitationToken}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("로그인 화면은 검색 노출을 유지하고 오류와 로그아웃 화면은 제외한다", async ({ browser }) => {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    await page.goto("/auth/signin");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    await page.goto("/auth/error");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    await page.goto("/auth/signout");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  } finally {
    await context.close();
  }
});

test("robots, sitemap, manifest가 공개 경로와 앱 설정을 제공한다", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt");
  const robots = await robotsResponse.text();

  expect(robotsResponse.status()).toBe(200);
  for (const path of privatePaths) {
    expect(robots).toContain(`Disallow: ${path}`);
  }
  expect(robots).toContain(`Sitemap: ${WEB_BASE_URL}/sitemap.xml`);

  const sitemapResponse = await request.get("/sitemap.xml");
  const sitemap = await sitemapResponse.text();

  expect(sitemapResponse.status()).toBe(200);
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])).toEqual([
    `${WEB_BASE_URL}/`,
    `${WEB_BASE_URL}/auth/signin`,
  ]);

  const manifestResponse = await request.get("/manifest.webmanifest");
  const manifest = await manifestResponse.json();

  expect(manifestResponse.status()).toBe(200);
  expect(manifest).toMatchObject({
    name: "우리집 가계부",
    short_name: "우리집 가계부",
    start_url: "/calendar",
    display: "standalone",
    background_color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
    theme_color: expect.stringMatching(/^#[0-9a-f]{6}$/i),
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  });
});
