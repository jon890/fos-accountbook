import { expect, test } from "./fixtures";
import { BACKEND_BASE_URL } from "./settings";

const darkTokens = {
  "--color-brand-tint": "oklch(0.205 0.030 257)",
  "--color-brand-50": "oklch(0.255 0.045 257)",
  "--color-brand-100": "oklch(0.300 0.065 257)",
  "--color-brand-200": "oklch(0.380 0.095 257)",
  "--color-brand-700": "oklch(0.800 0.110 257)",
  "--color-brand-800": "oklch(0.860 0.080 257)",
  "--color-brand-900": "oklch(0.920 0.045 257)",
  "--color-cat-food-bg": "oklch(0.300 0.060 35)",
  "--color-cat-food-fg": "oklch(0.800 0.110 35)",
  "--color-cat-cafe-bg": "oklch(0.300 0.060 60)",
  "--color-cat-cafe-fg": "oklch(0.800 0.110 60)",
  "--color-cat-transit-bg": "oklch(0.300 0.060 230)",
  "--color-cat-transit-fg": "oklch(0.800 0.110 230)",
  "--color-cat-telecom-bg": "oklch(0.300 0.060 280)",
  "--color-cat-telecom-fg": "oklch(0.800 0.110 280)",
  "--color-cat-home-bg": "oklch(0.300 0.060 188)",
  "--color-cat-home-fg": "oklch(0.800 0.110 188)",
  "--color-cat-shopping-bg": "oklch(0.300 0.060 330)",
  "--color-cat-shopping-fg": "oklch(0.800 0.110 330)",
  "--color-cat-health-bg": "oklch(0.300 0.060 152)",
  "--color-cat-health-fg": "oklch(0.800 0.110 152)",
  "--color-cat-leisure-bg": "oklch(0.300 0.060 105)",
  "--color-cat-leisure-fg": "oklch(0.800 0.110 105)",
  "--color-cat-education-bg": "oklch(0.300 0.060 250)",
  "--color-cat-education-fg": "oklch(0.800 0.110 250)",
  "--color-cat-etc-bg": "oklch(0.300 0.008 230)",
  "--color-cat-etc-fg": "oklch(0.760 0.015 230)",
  "--color-category-fallback-bg": "oklch(0.720 0.130 250 / 0.18)",
} as const;

const lightTokens = {
  "--color-brand-tint": "oklch(0.975 0.030 257)",
  "--color-brand-50": "oklch(0.975 0.020 257)",
  "--color-brand-100": "oklch(0.945 0.048 257)",
  "--color-brand-200": "oklch(0.890 0.090 257)",
  "--color-brand-700": "oklch(0.470 0.165 257)",
  "--color-brand-800": "oklch(0.385 0.130 257)",
  "--color-brand-900": "oklch(0.300 0.095 257)",
  "--color-cat-food-bg": "oklch(0.945 0.045 35)",
  "--color-cat-food-fg": "oklch(0.560 0.140 35)",
  "--color-cat-cafe-bg": "oklch(0.945 0.045 60)",
  "--color-cat-cafe-fg": "oklch(0.520 0.110 60)",
  "--color-cat-transit-bg": "oklch(0.945 0.045 230)",
  "--color-cat-transit-fg": "oklch(0.540 0.130 230)",
  "--color-cat-telecom-bg": "oklch(0.945 0.045 280)",
  "--color-cat-telecom-fg": "oklch(0.540 0.130 280)",
  "--color-cat-home-bg": "oklch(0.945 0.045 188)",
  "--color-cat-home-fg": "oklch(0.510 0.110 188)",
  "--color-cat-shopping-bg": "oklch(0.945 0.045 330)",
  "--color-cat-shopping-fg": "oklch(0.560 0.140 330)",
  "--color-cat-health-bg": "oklch(0.945 0.045 152)",
  "--color-cat-health-fg": "oklch(0.520 0.120 152)",
  "--color-cat-leisure-bg": "oklch(0.945 0.045 105)",
  "--color-cat-leisure-fg": "oklch(0.520 0.120 105)",
  "--color-cat-education-bg": "oklch(0.945 0.045 250)",
  "--color-cat-education-fg": "oklch(0.540 0.130 250)",
  "--color-cat-etc-bg": "oklch(0.945 0.005 230)",
  "--color-cat-etc-fg": "oklch(0.510 0.015 230)",
  "--color-category-fallback-bg": "oklch(0.540 0.130 250 / 0.12)",
} as const;

const fixedTokens = {
  "--color-brand-300": "oklch(0.810 0.135 257)",
  "--color-brand-400": "oklch(0.720 0.175 257)",
  "--color-brand-500": "oklch(0.640 0.190 257)",
  "--color-brand-600": "oklch(0.555 0.195 257)",
  "--color-brand-ink": "oklch(0.470 0.165 257)",
} as const;

const themedClasses = [
  "app-background",
  "glass",
  "gradient-primary",
  "gradient-expense",
  "gradient-income",
  "gradient-budget",
  "gradient-family",
  "gradient-category",
  "gradient-blue-purple",
  "gradient-emerald-green",
  "gradient-purple-indigo",
] as const;

const COLOR_CHANNEL_EPSILON = 0.0002;

test.use({ colorScheme: "dark" });

test("다크 테마에서 옅은 토큰과 화면 배경을 어둡게 표시한다", async ({ page }) => {
  await page.goto("/notifications");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const notification = page.getByText("식비 예산이 80%를 넘었습니다", { exact: true })
    .locator("xpath=ancestor::button");
  await expectBackgroundBelow(notification, 0.45);

  await page.goto("/settings");
  const selectedFamily = page.getByRole("radio", { name: "브라우저 테스트 가족", checked: true })
    .locator("xpath=ancestor::div[1]");
  await expectBackgroundBelow(selectedFamily, 0.45);
  const settingsCard = page.getByText("기본 가족 설정", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'bg-bg-elev')]");
  await expectBackgroundBelow(settingsCard.locator(".bg-brand-50").first(), 0.45);

  await page.goto("/categories");
  const categoryCard = page.getByText("식비", { exact: true })
    .locator("xpath=ancestor::div[@data-slot='card']")
    .first();
  await expectBackgroundBelow(categoryCard, 0.45);

  await assertTokenValues(page, darkTokens);
  await assertFixedTokensDoNotChange(page);
  await assertThemedClassStylesChange(page);
  await assertSelectedCategoryColors(page, "dark");
  await assertBudgetSurfaces(page, "dark");
});

test.describe("라이트 테마", () => {
  test.use({ colorScheme: "light" });

  test("라이트 테마에서 같은 화면 배경을 밝게 표시한다", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const notification = page.getByText("식비 예산이 80%를 넘었습니다", { exact: true })
      .locator("xpath=ancestor::button");
    await expectBackgroundAbove(notification, 0.85);

    await page.goto("/settings");
    const selectedFamily = page.getByRole("radio", { name: "브라우저 테스트 가족", checked: true })
      .locator("xpath=ancestor::div[1]");
    await expectBackgroundAbove(selectedFamily, 0.85);
    const settingsCard = page.getByText("기본 가족 설정", { exact: true })
      .locator("xpath=ancestor::div[contains(@class, 'bg-bg-elev')]");
    await expectBackgroundAbove(settingsCard.locator(".bg-brand-50").first(), 0.85);

    await page.goto("/categories");
    const categoryCard = page.getByText("식비", { exact: true })
      .locator("xpath=ancestor::div[@data-slot='card']")
      .first();
    await expectBackgroundAbove(categoryCard, 0.85);

    await assertTokenValues(page, lightTokens);
    await assertSelectedCategoryColors(page, "light");
    await assertBudgetSurfaces(page, "light");
  });
});

async function assertBudgetSurfaces(
  page: import("@playwright/test").Page,
  theme: "dark" | "light",
) {
  await page.goto("/budget");

  const budgetCard = page.locator("[data-slot='card'].gradient-primary")
    .filter({ hasText: "예산 남은 금액" })
    .first();
  await expect(budgetCard).toBeVisible();
  await expect(budgetCard).toHaveClass(/gradient-primary/);
  await expectGradientForegroundContrast(budgetCard, 3);

  const progress = budgetCard.locator("[data-slot='progress']");
  await expect(progress).toHaveClass(/bg-\[var\(--color-hero-track\)\]/);
  const progressColors = await progress.evaluate((element) => {
    const indicator = element.querySelector("[data-slot='progress-indicator']");
    if (!indicator) throw new Error("예산 진행 막대 채움이 없습니다");

    return {
      fill: getComputedStyle(indicator).backgroundColor,
      primary: getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
    };
  });
  expect(await normalizeColor(page, progressColors.fill)).not.toEqual(
    await normalizeColor(page, progressColors.primary),
  );

  await page.goto("/transactions?tab=recurring");
  const recurringList = page.getByRole("button", { name: /월세/ })
    .locator("xpath=ancestor::*[@data-slot='card']");
  await expect(recurringList).toBeVisible();
  await expect(recurringList).toHaveClass(/bg-bg-elev/);
  await expect(recurringList).toHaveClass(/border-border/);
  if (theme === "dark") {
    await expectBackgroundBelow(recurringList, 0.45);
  }

  const response = await page.request.post(`${BACKEND_BASE_URL}/__test/budget`, {
    data: { configured: false },
  });
  expect(response.ok()).toBe(true);

  await page.goto("/budget");
  const budgetSetupButton = page.getByRole("button", { name: "예산 설정하기" });
  await expect(budgetSetupButton).toHaveClass(/gradient-primary/);
  await expectGradientForegroundContrast(budgetSetupButton, 3);
}

async function assertTokenValues(
  page: import("@playwright/test").Page,
  expectedTokens: Record<string, string>,
) {
  const tokenValues = await page.locator("html").evaluate((element, tokens) => {
    const styles = getComputedStyle(element);
    return Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim()]));
  }, Object.keys(expectedTokens));
  expect(Object.values(tokenValues).every(Boolean)).toBe(true);

  const normalizedTokens = await page.evaluate(({ actual, expected }) => {
    const element = document.createElement("div");
    document.body.append(element);

    try {
      const normalize = (value: string) => {
        element.style.backgroundColor = `color-mix(in srgb, ${value} 100%, transparent)`;
        return getComputedStyle(element).backgroundColor;
      };
      return {
        actual: Object.fromEntries(Object.entries(actual).map(([token, value]) => [token, normalize(value)])),
        expected: Object.fromEntries(Object.entries(expected).map(([token, value]) => [token, normalize(value)])),
      };
    } finally {
      element.remove();
    }
  }, { actual: tokenValues, expected: expectedTokens });

  expectColorMapsClose(normalizedTokens.actual, normalizedTokens.expected);
}

async function assertFixedTokensDoNotChange(page: import("@playwright/test").Page) {
  await assertTokenValues(page, fixedTokens);
  const darkValues = await getTokenValues(page, Object.keys(fixedTokens));

  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  await assertTokenValues(page, fixedTokens);
  const lightValues = await getTokenValues(page, Object.keys(fixedTokens));

  expect(darkValues).toEqual(lightValues);

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
}

async function getTokenValues(
  page: import("@playwright/test").Page,
  tokens: readonly string[],
) {
  return page.locator("html").evaluate((element, tokenNames) => {
    const styles = getComputedStyle(element);
    return Object.fromEntries(tokenNames.map((token) => [token, styles.getPropertyValue(token).trim()]));
  }, [...tokens]);
}

async function assertThemedClassStylesChange(page: import("@playwright/test").Page) {
  const darkStyles = await getTemporaryElementStyles(page);

  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  const lightStyles = await getTemporaryElementStyles(page);

  for (const className of themedClasses) {
    expect(darkStyles[className]).not.toEqual(lightStyles[className]);
  }

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
}

async function getTemporaryElementStyles(page: import("@playwright/test").Page) {
  return page.evaluate((classes) => {
    const container = document.createElement("div");
    const styles: Record<string, string> = {};
    document.body.append(container);

    try {
      for (const className of classes) {
        const element = document.createElement("div");
        element.className = className;
        container.append(element);
        const computed = getComputedStyle(element);
        styles[className] = `${computed.background}|${computed.backgroundColor}|${computed.backgroundImage}|${computed.borderColor}`;
      }
    } finally {
      container.remove();
    }

    return styles;
  }, [...themedClasses]);
}

async function assertSelectedCategoryColors(
  page: import("@playwright/test").Page,
  theme: "dark" | "light",
) {
  await page.goto("/transactions");
  await page.getByRole("button", { name: "거래 추가" }).click();
  const firstCategory = page.getByRole("radiogroup", { name: "카테고리 선택" })
    .getByRole("radio")
    .first();
  const initialBackground = await firstCategory.evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(firstCategory).toHaveAccessibleName("식비");
  await firstCategory.click();
  await expect(firstCategory).toHaveAttribute("aria-checked", "true");
  await expect.poll(
    () => firstCategory.evaluate((element) => getComputedStyle(element).backgroundColor),
  ).not.toBe(initialBackground);
  await firstCategory.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });

  const colors = await firstCategory.evaluate((element) => {
    const label = element.querySelector("span:last-child");
    return {
      background: getComputedStyle(element).backgroundColor,
      foreground: label ? getComputedStyle(label).color : "",
    };
  });

  if (theme === "dark") {
    await expectCategoryColors(page, colors, darkTokens["--color-cat-food-bg"], darkTokens["--color-cat-food-fg"]);
    expect(colorLightness(colors.background)).toBeLessThan(0.45);
    expect(colorLightness(colors.foreground)).toBeGreaterThan(0.35);
    return;
  }

  await expectCategoryColors(page, colors, "oklch(0.945 0.045 35)", "oklch(0.560 0.140 35)");
  expect(colorLightness(colors.background)).toBeGreaterThan(0.85);
  expect(colorLightness(colors.foreground)).toBeLessThan(colorLightness(colors.background));
}

async function expectCategoryColors(
  page: import("@playwright/test").Page,
  actual: { background: string; foreground: string },
  expectedBackground: string,
  expectedForeground: string,
) {
  expectColorMapsClose(
    {
      background: await normalizeColor(page, actual.background),
      foreground: await normalizeColor(page, actual.foreground),
    },
    {
      background: await normalizeColor(page, expectedBackground),
      foreground: await normalizeColor(page, expectedForeground),
    },
  );
}

async function normalizeColor(page: import("@playwright/test").Page, color: string) {
  return page.evaluate((value) => {
    const element = document.createElement("div");
    element.style.backgroundColor = `color-mix(in srgb, ${value} 100%, transparent)`;
    document.body.append(element);

    try {
      return getComputedStyle(element).backgroundColor;
    } finally {
      element.remove();
    }
  }, color);
}

async function expectGradientForegroundContrast(
  locator: import("@playwright/test").Locator,
  minimumContrast: number,
) {
  const colors = await locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    const stops = [...styles.backgroundImage.matchAll(/(?:oklch|oklab|lab)\([^)]*\)/g)]
      .map((match) => match[0]);
    if (stops.length === 0) throw new Error("그라디언트 정지점을 찾을 수 없습니다");

    return { foreground: styles.color, stops };
  });

  const page = locator.page();
  const foreground = await normalizeColor(page, colors.foreground);
  const contrasts = await Promise.all(colors.stops.map(async (stop) => {
    const background = await normalizeColor(page, stop);
    return contrastRatio(foreground, background);
  }));

  for (const contrast of contrasts) {
    expect(contrast).toBeGreaterThanOrEqual(minimumContrast);
  }
}

function expectColorMapsClose(
  actual: Record<string, string>,
  expected: Record<string, string>,
) {
  expect(Object.keys(actual)).toEqual(Object.keys(expected));

  for (const token of Object.keys(expected)) {
    const actualChannels = colorChannels(actual[token]);
    const expectedChannels = colorChannels(expected[token]);

    expect(actualChannels).toHaveLength(expectedChannels.length);
    actualChannels.forEach((channel, index) => {
      expect(Math.abs(channel - expectedChannels[index])).toBeLessThanOrEqual(COLOR_CHANNEL_EPSILON);
    });
  }
}

function colorChannels(color: string): number[] {
  return [...color.matchAll(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)].map((match) => Number(match[0]));
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(colorChannels(foreground));
  const backgroundLuminance = relativeLuminance(colorChannels(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(channels: number[]): number {
  const normalized = channels.slice(0, 3).map((channel) => (
    channel > 1 ? channel / 255 : channel
  ));
  const linear = normalized.map((channel) => (
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

async function expectBackgroundBelow(locator: import("@playwright/test").Locator, limit: number) {
  await expect(locator).toBeVisible();
  const color = await locator.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(colorLightness(color)).toBeLessThan(limit);
}

async function expectBackgroundAbove(locator: import("@playwright/test").Locator, limit: number) {
  await expect(locator).toBeVisible();
  const color = await locator.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(colorLightness(color)).toBeGreaterThan(limit);
}

function colorLightness(color: string): number {
  const oklch = color.match(/^oklch\(([-+]?\d*\.?\d+)/);
  if (oklch) return Number(oklch[1]);

  const oklab = color.match(/^oklab\(([-+]?\d*\.?\d+)/);
  if (oklab) return Number(oklab[1]);

  const lab = color.match(/^lab\(([-+]?\d*\.?\d+)/);
  if (lab) return Number(lab[1]) / 100;

  const rgb = color.match(/^rgba?\(([^)]+)\)$/);
  if (!rgb) throw new Error(`지원하지 않는 계산 색상: ${color}`);

  const [red, green, blue] = rgb[1].split(",").slice(0, 3).map((value) => Number(value.trim()) / 255);
  const linear = [red, green, blue].map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
