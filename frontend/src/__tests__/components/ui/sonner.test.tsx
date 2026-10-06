import { Toaster } from "@/components/ui/sonner";
import { render } from "@testing-library/react";
import { useTheme } from "next-themes";

const mockedSonner = jest.fn<null, [unknown]>(() => null);

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

jest.mock("sonner", () => ({
  Toaster: (props: unknown) => mockedSonner(props),
}));

const mockedUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("Toaster", () => {
  beforeEach(() => {
    mockedSonner.mockClear();
  });

  it("system 선택 시 실제 적용된 다크 테마를 Sonner에 전달한다", () => {
    mockedUseTheme.mockReturnValue({
      theme: "system",
      resolvedTheme: "dark",
      setTheme: jest.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
      forcedTheme: undefined,
    });

    render(<Toaster />);

    expect(mockedSonner).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "dark" }),
    );
  });
});
