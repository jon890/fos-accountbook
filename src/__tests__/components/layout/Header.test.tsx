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
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";

// Next.js 의존성 모킹
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/components/families/FamilySelectorDropdown", () => ({
  FamilySelectorDropdown: () => (
    <div data-testid="family-selector">Family Selector</div>
  ),
}));

jest.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: ({ familyUuid }: { familyUuid: string }) => (
    <div data-testid="notification-bell">Notification {familyUuid}</div>
  ),
}));

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
};

// Mock Session 데이터
const createMockSession = (overrides?: Partial<Session>): Session => ({
  user: {
    id: "user-123",
    name: "홍길동",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  },
  expires: "2025-12-31T23:59:59.999Z",
  ...overrides,
});

describe("Header", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
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

  it("로고를 클릭하면 대시보드로 이동한다", async () => {
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
    expect(logo).toHaveAttribute("href", "/dashboard");
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
        id: "user-456",
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
        id: "user-789",
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

  it("로그아웃 버튼을 클릭하면 로그아웃 페이지로 이동한다", async () => {
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

    // Then
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/auth/signout");
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
});
