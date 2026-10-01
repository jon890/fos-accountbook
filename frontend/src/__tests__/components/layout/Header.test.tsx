/**
 * Header 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 기본 렌더링
 * - 로고 표시
 * - 유저 아바타 표시
 * - 드롭다운 메뉴 구조
 * - 반응형 (모바일에서 FamilySelector 숨김)
 */

import { Header } from "@/components/layout/Header";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAppRouter } from "@/lib/client/navigation";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import { toast } from "sonner";

// Next.js 의존성 모킹
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: jest.fn(),
}));

// Server Action 모킹
const mockSignOutAction = jest.fn();
jest.mock("@/actions/auth/signout-action", () => ({
  signOutAction: (...args: unknown[]) => mockSignOutAction(...args),
}));

jest.mock("@/components/families/FamilySelectorDropdown", () => ({
  FamilySelectorDropdown: () => (
    <div data-testid="family-selector">Family Selector</div>
  ),
}));

jest.mock("@/components/families/FamilySelectorList", () => ({
  FamilySelectorList: () => <div data-testid="family-selector-list" />,
}));

jest.mock("@/actions/family/get-families-action", () => ({
  getFamiliesAction: jest.fn(),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

jest.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: ({ familyUuid }: { familyUuid: string }) => (
    <div data-testid="notification-bell">Notification {familyUuid}</div>
  ),
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
};

// Mock Session 데이터
const createMockSession = (overrides?: Partial<Session>): Session => ({
  user: {
    userUuid: "user-123",
    name: "홍길동",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  },
  expires: "2025-12-31T23:59:59.999Z",
  ...overrides,
});

describe("Header", () => {
  beforeEach(() => {
    (useAppRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.mocked(usePathname).mockReturnValue("/calendar");
    jest.mocked(getFamiliesAction).mockResolvedValue({ success: true, data: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("기본 요소들을 렌더링한다", async () => {
    // Given
    const session = createMockSession();

    // When
    render(<Header session={session} selectedFamilyUuid={null} />);

    // Then
    expect(screen.getByText("우리집 가계부")).toBeInTheDocument();
    // FamilySelectorDropdown은 dynamic import로 로드되므로 waitFor 사용
    await waitFor(() => {
      expect(screen.getByTestId("family-selector")).toBeInTheDocument();
    });
  });

  it.each(["/categories", "/categories/new", "/budget", "/notifications", "/settings/profile", "/invite/token"])("하위 화면 %s에 뒤로 가기를 표시한다", (pathname) => {
    jest.mocked(usePathname).mockReturnValue(pathname);
    render(<Header session={createMockSession()} selectedFamilyUuid={null} />);
    expect(screen.getByRole("button", { name: "뒤로 가기" })).toBeInTheDocument();
    expect(screen.queryByText("우리집 가계부")).not.toBeInTheDocument();
  });

  it.each(["", "https://external.example/calendar", "invalid", "http://localhost:4000/menu", "https://localhost/menu"])("외부 진입 또는 빈 referrer %s는 전체 메뉴로 이동한다", async (referrer) => {
    jest.mocked(usePathname).mockReturnValue("/categories");
    const referrerSpy = jest.spyOn(document, "referrer", "get").mockReturnValue(referrer);
    const historyLength = jest.spyOn(window.history, "length", "get").mockReturnValue(10);
    render(<Header session={createMockSession()} selectedFamilyUuid={null} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "뒤로 가기" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/menu");
    expect(mockRouter.back).not.toHaveBeenCalled();
    historyLength.mockRestore();
    referrerSpy.mockRestore();
  });

  it("같은 사이트에서 들어왔으면 뒤로 이동한다", async () => {
    jest.mocked(usePathname).mockReturnValue("/categories");
    const referrerSpy = jest.spyOn(document, "referrer", "get").mockReturnValue(`${window.location.origin}/menu`);
    render(<Header session={createMockSession()} selectedFamilyUuid={null} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "뒤로 가기" }));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
    referrerSpy.mockRestore();
  });

  it.each(["/calendar", "/menu"])("%s에 로고를 표시한다", (pathname) => {
    jest.mocked(usePathname).mockReturnValue(pathname);
    render(<Header session={createMockSession()} selectedFamilyUuid={null} />);
    expect(screen.getByRole("link", { name: "우리집 가계부" })).toHaveAttribute("href", "/calendar");
    expect(screen.queryByRole("button", { name: "뒤로 가기" })).not.toBeInTheDocument();
  });

  it("로고를 클릭하면 달력으로 이동한다", async () => {
    // Given
    const session = createMockSession();
    const user = userEvent.setup();
    render(<Header session={session} selectedFamilyUuid={null} />);

    // When
    const logo = screen.getByText("우리집 가계부").closest("a");
    if (logo) {
      await user.click(logo);
    }

    // Then
    expect(logo).toHaveAttribute("href", "/calendar");
  });

  it("사용자 아바타를 표시한다", () => {
    // Given
    const session = createMockSession();

    // When
    render(<Header session={session} selectedFamilyUuid={null} />);

    // Then
    const avatar = screen.getByText("홍");
    expect(avatar).toBeInTheDocument();
  });

  it("사용자 이미지가 없으면 첫 글자를 표시한다", () => {
    // Given
    const session = createMockSession({
      user: {
        userUuid: "user-456",
        name: "김철수",
        email: "kim@example.com",
        image: undefined,
      },
    });

    // When
    render(<Header session={session} selectedFamilyUuid={null} />);

    // Then
    expect(screen.getByText("김")).toBeInTheDocument();
  });

  it("사용자 이름이 없으면 'U'를 표시한다", () => {
    // Given
    const session = createMockSession({
      user: {
        userUuid: "user-789",
        name: undefined,
        email: "test@example.com",
        image: undefined,
      },
    });

    // When
    render(<Header session={session} selectedFamilyUuid={null} />);

    // Then
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("유저 드롭다운을 클릭하면 메뉴가 표시된다", async () => {
    // Given
    const session = createMockSession();
    const user = userEvent.setup();
    render(<Header session={session} selectedFamilyUuid={null} />);

    // When
    const avatarButton = screen
      .getByText("홍")
      .closest("button") as HTMLElement;
    await user.click(avatarButton);

    // Then
    await waitFor(() => {
      expect(screen.getByText("홍길동")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByText("설정")).toBeInTheDocument();
      expect(screen.getByText("로그아웃")).toBeInTheDocument();
    });
  });

  it("설정 메뉴를 클릭하면 설정 페이지로 이동한다", async () => {
    // Given
    const session = createMockSession();
    const user = userEvent.setup();
    render(<Header session={session} selectedFamilyUuid={null} />);

    // When
    const avatarButton = screen
      .getByText("홍")
      .closest("button") as HTMLElement;
    await user.click(avatarButton);

    await waitFor(async () => {
      const settingsButton = screen.getByText("설정");
      await user.click(settingsButton);
    });

    // Then
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/settings");
    });
  });

  it("로그아웃 버튼을 클릭하면 signOutAction 을 호출한다", async () => {
    // Given
    const session = createMockSession();
    const user = userEvent.setup();
    render(<Header session={session} selectedFamilyUuid={null} />);

    // When
    const avatarButton = screen
      .getByText("홍")
      .closest("button") as HTMLElement;
    await user.click(avatarButton);

    await waitFor(async () => {
      const logoutButton = screen.getByText("로그아웃");
      await user.click(logoutButton);
    });

    // Then — signOutAction 이 onSelect 에서 직접 호출됨 (ADR-F27)
    await waitFor(() => {
      expect(mockSignOutAction).toHaveBeenCalled();
    });
  });

  it("선택된 가족이 있을 때 알림 벨을 표시한다", async () => {
    // Given
    const session = createMockSession();
    const selectedFamilyUuid = "family-uuid-123";

    // When
    render(
      <Header session={session} selectedFamilyUuid={selectedFamilyUuid} />
    );

    // Then
    // NotificationBell은 dynamic import로 로드되므로 waitFor 사용
    await waitFor(() => {
      expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
      expect(
        screen.getByText("Notification family-uuid-123")
      ).toBeInTheDocument();
    });
  });

  it("선택된 가족이 없을 때 알림 벨을 표시하지 않는다", async () => {
    // Given
    const session = createMockSession();

    // When
    render(<Header session={session} selectedFamilyUuid={null} />);

    // Then
    // NotificationBell은 selectedFamilyUuid가 null이면 렌더링되지 않음
    expect(screen.queryByTestId("notification-bell")).not.toBeInTheDocument();
  });

  it("FamilySelector에 모바일 숨김 클래스가 적용되어 있다", async () => {
    // Given
    const session = createMockSession();

    // When
    render(<Header session={session} selectedFamilyUuid={null} />);

    // Then
    // FamilySelectorDropdown은 dynamic import로 로드되므로 waitFor 사용
    await waitFor(() => {
      const familySelector = screen.getByTestId("family-selector");
      const familySelectorWrapper = familySelector.parentElement;
      expect(familySelectorWrapper).toHaveClass("hidden");
      expect(familySelectorWrapper).toHaveClass("md:block");
    });
  });

  it("가족 전환을 누르면 조회가 끝나기 전에 시트와 세 줄 스켈레톤을 표시한다", async () => {
    let resolveFamilies!: (value: { success: true; data: [] }) => void;
    jest.mocked(getFamiliesAction).mockReturnValue(
      new Promise((resolve) => {
        resolveFamilies = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<Header session={createMockSession()} selectedFamilyUuid={null} />);

    await user.click(screen.getByText("홍").closest("button") as HTMLButtonElement);
    await user.click(screen.getByText("가족 전환"));

    expect(screen.getByRole("heading", { name: "가족 전환" })).toBeInTheDocument();
    expect(screen.getByLabelText("가족 목록을 불러오는 중").querySelectorAll(".ab-skel")).toHaveLength(3);

    resolveFamilies({ success: true, data: [] });
  });

  it("가족 목록 조회 실패 시 시트를 닫고 오류 토스트를 표시한다", async () => {
    jest.mocked(getFamiliesAction).mockResolvedValue({
      success: false,
      error: { code: "F001", message: "조회 실패" },
    });
    const user = userEvent.setup();
    render(<Header session={createMockSession()} selectedFamilyUuid={null} />);

    await user.click(screen.getByText("홍").closest("button") as HTMLButtonElement);
    await user.click(screen.getByText("가족 전환"));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "가족 전환" })).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith("가족 목록을 불러오지 못했습니다.");
    });
  });
});
