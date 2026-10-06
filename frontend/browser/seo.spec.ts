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

function pngDimensions(image: Buffer) {
  expect(image.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  expect(image.subarray(12, 16).toString("ascii")).toBe("IHDR");

  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
}

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

test("링크 미리보기와 앱 아이콘을 PNG로 제공한다", async ({ browser, request }) => {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    await page.goto("/");

    const openGraphImageUrl = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    const iconUrl = await page.locator('link[rel="icon"]').getAttribute("href");
    const appleIconUrl = await page
      .locator('link[rel="apple-touch-icon"]')
      .getAttribute("href");

    expect(openGraphImageUrl).toBeTruthy();
    expect(iconUrl).toBeTruthy();
    expect(appleIconUrl).toBeTruthy();
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "우리집 가계부: 가족이 함께 쓰는 가계부",
    );
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("sizes", "512x512");
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "sizes",
      "180x180",
    );

    const imageResponses = await Promise.all([
      request.get(openGraphImageUrl!),
      request.get(iconUrl!),
      request.get(appleIconUrl!),
    ]);
    const expectedDimensions = [
      { width: 1200, height: 630 },
      { width: 512, height: 512 },
      { width: 180, height: 180 },
    ];

    for (const [index, response] of imageResponses.entries()) {
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");

      const image = await response.body();
      expect(image.length).toBeGreaterThan(0);
      expect(pngDimensions(image)).toEqual(expectedDimensions[index]);
    }

    const manifestResponse = await request.get("/manifest.webmanifest");
    const manifest = (await manifestResponse.json()) as {
      icons: Array<{ src: string }>;
    };

    for (const icon of manifest.icons) {
      const response = await request.get(icon.src);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  } finally {
    await context.close();
  }
});
