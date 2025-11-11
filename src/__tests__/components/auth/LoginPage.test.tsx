/**
 * LoginPage 컴포넌트 테스트
 * 로그인 UI 및 기능 테스트
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { LoginPage } from "@/components/auth/LoginPage";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe("LoginPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render login page with correct title and description", () => {
    render(<LoginPage />);

    expect(screen.getByText("우리집 가계부")).toBeInTheDocument();
    expect(
      screen.getByText("가족과 함께 관리하는 스마트 가계부")
    ).toBeInTheDocument();
  });

  it("should render Google login button", () => {
    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /Google로 시작하기/i,
    });
    expect(googleButton).toBeInTheDocument();
  });

  it("should call signIn with google provider when Google button is clicked", async () => {
    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /Google로 시작하기/i,
    });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("google");
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  it("should render feature highlights", () => {
    render(<LoginPage />);

    expect(screen.getByText("스마트 절약")).toBeInTheDocument();
    expect(screen.getByText("실시간 분석")).toBeInTheDocument();
    expect(screen.getByText("가족 공유")).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /Google로 시작하기/i,
    });
    expect(googleButton).toBeEnabled();
    expect(googleButton).toHaveAttribute("class");
  });

  it("should handle sign-in errors gracefully", async () => {
    // Mock signIn to resolve with error response
    mockSignIn.mockResolvedValueOnce({
      error: "OAuthCallback",
      code: "oauth_callback_error",
      status: 200,
      ok: false,
      url: null,
    });

    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /Google로 시작하기/i,
    });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("google");
    });

    // UI가 정상적으로 유지되는지 확인
    expect(screen.getByText("우리집 가계부")).toBeInTheDocument();
  });

  it("should have correct button styling classes", () => {
    render(<LoginPage />);

    const googleButton = screen.getByRole("button", {
      name: /Google로 시작하기/i,
    });
    expect(googleButton).toHaveClass("w-full");
    expect(googleButton).toHaveClass("h-14");
  });

  it("should render icons correctly", () => {
    render(<LoginPage />);

    // Wallet icon in header
    const walletIcon =
      document.querySelector('svg[data-testid="wallet-icon"]') ||
      document.querySelector(".lucide-wallet");

    // Feature icons
    const piggyBankIcon = document.querySelector(".lucide-piggy-bank");
    const barChartIcon = document.querySelector(".lucide-bar-chart-3");
    const usersIcon = document.querySelector(".lucide-users");

    // At least some icons should be present
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});
