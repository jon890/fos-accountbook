/**
 * AddIncomeDialog 컴포넌트 테스트
 */

import { getFamilyCategoriesAction } from "@/app/actions/category-actions";
import { AddIncomeDialog } from "@/components/incomes/AddIncomeDialog";
import { render, screen, waitFor } from "@testing-library/react";

// Mock modules
jest.mock("@/app/actions/category-actions");
jest.mock("@/app/actions/income-actions");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetFamilyCategories =
  getFamilyCategoriesAction as jest.MockedFunction<
    typeof getFamilyCategoriesAction
  >;

describe("AddIncomeDialog", () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("다이얼로그가 열리면 카테고리를 로드한다", async () => {
    // Given
    mockGetFamilyCategories.mockResolvedValue([
      {
        uuid: "category-1",
        familyUuid: "family-1",
        name: "급여",
        icon: "💰",
        color: "#10B981",
        createdAt: "2024-10-21T00:00:00Z",
        updatedAt: "2024-10-21T00:00:00Z",
      },
      {
        uuid: "category-2",
        familyUuid: "family-1",
        name: "보너스",
        icon: "🎁",
        color: "#3B82F6",
        createdAt: "2024-10-21T00:00:00Z",
        updatedAt: "2024-10-21T00:00:00Z",
      },
    ]);

    // When
    render(<AddIncomeDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Then
    await waitFor(() => {
      expect(screen.getByText("수입 추가")).toBeInTheDocument();
    });

    expect(mockGetFamilyCategories).toHaveBeenCalled();
  });

  it("폼 필드들이 올바르게 렌더링된다", async () => {
    // Given
    mockGetFamilyCategories.mockResolvedValue([
      {
        uuid: "category-1",
        familyUuid: "family-1",
        name: "급여",
        icon: "💰",
        color: "#10B981",
        createdAt: "2024-10-21T00:00:00Z",
        updatedAt: "2024-10-21T00:00:00Z",
      },
    ]);

    // When
    render(<AddIncomeDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Then
    await waitFor(() => {
      expect(screen.getByLabelText(/금액/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/카테고리/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/메모/i)).toBeInTheDocument();
      expect(screen.getByText("취소")).toBeInTheDocument();
      expect(screen.getByText("수입 추가")).toBeInTheDocument();
    });
  });

  it("카테고리 로드 실패 시 에러 처리를 한다", async () => {
    // Given
    mockGetFamilyCategories.mockRejectedValue(new Error("Failed to load"));

    // When
    render(<AddIncomeDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Then
    await waitFor(() => {
      expect(mockGetFamilyCategories).toHaveBeenCalled();
    });
  });
});
