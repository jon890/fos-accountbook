import { expect, test } from "./fixtures";

test("화면 테마 선택은 새로고침 뒤에도 유지되고 시스템 설정으로 되돌릴 수 있다", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  const hydrationErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydration/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/settings");

  const darkTheme = page.getByRole("radio", { name: "다크" });
  await darkTheme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("radio", { name: "시스템 설정 따르기" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(pageErrors).toEqual([]);
  expect(hydrationErrors).toEqual([]);
});
