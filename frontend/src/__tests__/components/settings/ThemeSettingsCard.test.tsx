/**
 * ThemeSettingsCard 컴포넌트 테스트
 * @jest-environment jsdom
 */

const mockSetTheme = jest.fn();
let mockTheme = "system";

jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

import { ThemeSettingsCard } from "@/components/settings/ThemeSettingsCard";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";

describe("ThemeSettingsCard", () => {
  beforeEach(() => {
    mockTheme = "system";
    mockSetTheme.mockClear();
  });

  it("서버 렌더에서는 테마를 선택하지 않는다", () => {
    mockTheme = "dark";

    const markup = renderToString(<ThemeSettingsCard />);

    expect(markup).toMatch(
      /role="radio" aria-checked="false"[^>]*value="system"/
    );
    expect(markup).toMatch(
      /role="radio" aria-checked="false"[^>]*value="light"/
    );
    expect(markup).toMatch(
      /role="radio" aria-checked="false"[^>]*value="dark"/
    );
  });

  it("현재 테마를 선택된 상태로 표시한다", () => {
    mockTheme = "light";

    render(<ThemeSettingsCard />);

    expect(
      screen.getByRole("radio", { name: "라이트" })
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "시스템 설정 따르기" })
    ).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "다크" })).not.toBeChecked();
  });

  it("다크를 누르면 next-themes에 다크 테마를 요청한다", async () => {
    const user = userEvent.setup();

    render(<ThemeSettingsCard />);

    await user.click(screen.getByRole("radio", { name: "다크" }));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
