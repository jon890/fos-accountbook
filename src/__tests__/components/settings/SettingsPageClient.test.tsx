/**
 * SettingsPageClient 컴포넌트 테스트
 * @jest-environment jsdom
 */

// Mock modules - import 전에 선언해야 함
jest.mock("@/lib/server/auth/config", () => ({
  authConfig: { providers: [], session: { strategy: "jwt" } },
}));
jest.mock("@/lib/server/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));
jest.mock("@/lib/server/api/client", () => ({
  serverApiClient: jest.fn(),
}));
jest.mock("@/app/actions/user/set-default-family-action", () => ({
  setDefaultFamilyAction: jest.fn(),
}));
jest.mock("@/app/actions/family/update-family-action", () => ({
  updateFamilyAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPageClient } from "@/components/settings/SettingsPageClient";
import { setDefaultFamilyAction } from "@/app/actions/user/set-default-family-action";
import { updateFamilyAction } from "@/app/actions/family/update-family-action";
import type { Family } from "@/types/family";

const mockSetDefaultFamilyAction =
  setDefaultFamilyAction as jest.MockedFunction<typeof setDefaultFamilyAction>;
const mockUpdateFamilyAction = updateFamilyAction as jest.MockedFunction<
  typeof updateFamilyAction
>;

describe("SettingsPageClient", () => {
  const mockFamilies: Family[] = [
    {
      uuid: "family-1",
      name: "김씨네 가족",
      monthlyBudget: 1000000,
      members: [{ uuid: "user-1", name: "김철수", email: "kim@test.com" }],
      categories: [],
      expenseCount: 10,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      uuid: "family-2",
      name: "이씨네 가족",
      monthlyBudget: 2000000,
      members: [{ uuid: "user-2", name: "이영희", email: "lee@test.com" }],
      categories: [],
      expenseCount: 5,
      createdAt: "2024-01-02T00:00:00Z",
    },
    {
      uuid: "family-3",
      name: "박씨네 가족",
      monthlyBudget: 0,
      members: [],
      categories: [],
      expenseCount: 0,
      createdAt: "2024-01-03T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("기본 가족 선택", () => {
    it("defaultFamilyUuid가 제공되면 해당 가족이 초기에 선택되어 있다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-2"
        />
      );

      // "이씨네 가족" 라디오 버튼이 선택되어 있는지 확인
      const radioButton = screen.getByRole("radio", {
        name: /이씨네 가족/i,
      }) as HTMLInputElement;
      expect(radioButton).toBeChecked();
    });

    it("defaultFamilyUuid가 null이면 아무것도 선택되지 않는다", () => {
      render(
        <SettingsPageClient families={mockFamilies} defaultFamilyUuid={null} />
      );

      // 모든 라디오 버튼이 선택되지 않은 상태인지 확인
      const radioButtons = screen.getAllByRole("radio");
      radioButtons.forEach((radio) => {
        expect(radio).not.toBeChecked();
      });
    });

    it("현재 기본 가족에 '현재 기본' 배지가 표시된다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // "현재 기본" 배지가 표시되는지 확인
      expect(screen.getByText("현재 기본")).toBeInTheDocument();
    });

    it("기본 가족이 아닌 항목에는 '현재 기본' 배지가 표시되지 않는다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // "현재 기본" 배지는 1개만 있어야 함 (family-1에만)
      const badges = screen.getAllByText("현재 기본");
      expect(badges).toHaveLength(1);
    });
  });

  describe("기본 가족 변경", () => {
    it("다른 가족을 선택하고 저장할 수 있다", async () => {
      const user = userEvent.setup();
      mockSetDefaultFamilyAction.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // "이씨네 가족" 선택
      const radioButton = screen.getByRole("radio", {
        name: /이씨네 가족/i,
      });
      await user.click(radioButton);

      // 저장 버튼 클릭
      const saveButton = screen.getByRole("button", {
        name: /기본 가족으로 설정/i,
      });
      await user.click(saveButton);

      // API 호출 확인
      await waitFor(() => {
        expect(mockSetDefaultFamilyAction).toHaveBeenCalledWith("family-2");
      });
    });

    it("같은 가족을 선택하면 저장 버튼이 비활성화된다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // 저장 버튼이 비활성화되어 있는지 확인 (이미 현재 기본 가족이므로)
      const saveButton = screen.getByRole("button", {
        name: /기본 가족으로 설정/i,
      });
      expect(saveButton).toBeDisabled();
    });

    it("가족을 선택하지 않으면 저장 버튼이 비활성화된다", () => {
      render(
        <SettingsPageClient families={mockFamilies} defaultFamilyUuid={null} />
      );

      const saveButton = screen.getByRole("button", {
        name: /기본 가족으로 설정/i,
      });
      expect(saveButton).toBeDisabled();
    });
  });

  describe("월 예산 설정", () => {
    it("모든 가족의 월 예산이 표시된다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      expect(screen.getByText("월 예산: 1,000,000원")).toBeInTheDocument();
      expect(screen.getByText("월 예산: 2,000,000원")).toBeInTheDocument();
      expect(screen.getByText("예산 미설정")).toBeInTheDocument();
    });

    it("예산 수정 버튼을 클릭하면 입력 필드가 표시된다", async () => {
      const user = userEvent.setup();

      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // "김씨네 가족"의 수정 버튼 찾기
      const editButtons = screen.getAllByRole("button", { name: /수정/i });
      await user.click(editButtons[0]);

      // 입력 필드가 표시되는지 확인
      const input = screen.getByPlaceholderText("월 예산 입력");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(1000000);
    });

    it("예산을 수정하고 저장할 수 있다", async () => {
      const user = userEvent.setup();
      mockUpdateFamilyAction.mockResolvedValueOnce({
        success: true,
        data: {
          uuid: "family-1",
          name: "김씨네 가족",
          monthlyBudget: 1500000,
          members: [],
          categories: [],
          expenseCount: 10,
          createdAt: "2024-01-01T00:00:00Z",
        },
      });

      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // 수정 버튼 클릭
      const editButtons = screen.getAllByRole("button", { name: /수정/i });
      await user.click(editButtons[0]);

      // 예산 입력
      const input = screen.getByPlaceholderText("월 예산 입력");
      await user.clear(input);
      await user.type(input, "1500000");

      // 저장 버튼 클릭 (Save 아이콘 버튼 찾기 - 취소 버튼 이후의 버튼)
      const allIconButtons = screen.getAllByRole("button");
      const saveButton = allIconButtons.find((btn) => {
        const svg = btn.querySelector("svg.lucide-save");
        return svg !== null;
      });

      if (saveButton) {
        await user.click(saveButton);
      }

      // API 호출 확인
      await waitFor(() => {
        expect(mockUpdateFamilyAction).toHaveBeenCalledWith("family-1", {
          name: "김씨네 가족",
          monthlyBudget: 1500000,
        });
      });
    });
  });

  describe("가족 목록", () => {
    it("모든 가족이 목록에 표시된다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      // 모든 가족 이름이 화면에 표시되는지 확인 (여러 섹션에 나타날 수 있음)
      const allFamilyNames =
        screen.getAllByText(/김씨네 가족|이씨네 가족|박씨네 가족/);
      expect(allFamilyNames.length).toBeGreaterThanOrEqual(3);
    });

    it("가족 정보가 올바르게 표시된다", () => {
      render(
        <SettingsPageClient
          families={mockFamilies}
          defaultFamilyUuid="family-1"
        />
      );

      expect(
        screen.getByText(/구성원 1명 · 카테고리 0개 · 지출 10건/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/구성원 1명 · 카테고리 0개 · 지출 5건/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/구성원 0명 · 카테고리 0개 · 지출 0건/)
      ).toBeInTheDocument();
    });
  });
});
