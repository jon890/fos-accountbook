/**
 * StatsCards 컴포넌트 테스트
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("StatsCards", () => {
  const mockData = {
    monthlyExpense: 500000,
    monthlyIncome: 1000000,
    remainingBudget: 300000,
    familyMembers: 4,
    budget: 800000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    } as ReturnType<typeof useRouter>);
  });

  describe("카드 렌더링", () => {
    it("모든 카드가 올바른 데이터와 함께 표시된다", () => {
      render(<StatsCards data={mockData} />);

      // 지출 카드
      expect(screen.getByText("이번 달 지출")).toBeInTheDocument();
      expect(screen.getByText("₩500,000")).toBeInTheDocument();

      // 수입 카드
      expect(screen.getByText("이번 달 수입")).toBeInTheDocument();
      expect(screen.getByText("₩1,000,000")).toBeInTheDocument();
      expect(screen.getByText(/순수익: ₩500,000/)).toBeInTheDocument();

      // 예산 카드
      expect(screen.getByText("예산 남은 금액")).toBeInTheDocument();
      expect(screen.getByText("₩300,000")).toBeInTheDocument();

      // 가족 구성원 카드
      expect(screen.getByText("가족 구성원")).toBeInTheDocument();
      expect(screen.getByText("4명")).toBeInTheDocument();
    });

    it("예산 초과 시 올바르게 표시된다", () => {
      const overBudgetData = {
        ...mockData,
        remainingBudget: -100000,
      };

      render(<StatsCards data={overBudgetData} />);

      expect(screen.getByText("예산 초과")).toBeInTheDocument();
      expect(screen.getByText("₩100,000")).toBeInTheDocument();
      expect(screen.getByText("초과")).toBeInTheDocument();
    });

    it("예산이 0일 때 '예산 미설정' 메시지가 표시된다", () => {
      const noBudgetData = {
        ...mockData,
        budget: 0,
        remainingBudget: 0,
      };

      render(<StatsCards data={noBudgetData} />);

      expect(screen.getByText("예산 미설정")).toBeInTheDocument();
    });
  });

  describe("카드 클릭 동작", () => {
    it("지출 카드 클릭 시 지출 탭 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      render(<StatsCards data={mockData} />);

      const expenseCard = screen.getByText("이번 달 지출").closest("div")!
        .parentElement!.parentElement;
      await user.click(expenseCard!);

      expect(mockPush).toHaveBeenCalledWith("/transactions?tab=expenses");
    });

    it("수입 카드 클릭 시 수입 탭 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      render(<StatsCards data={mockData} />);

      const incomeCard = screen.getByText("이번 달 수입").closest("div")!
        .parentElement!.parentElement;
      await user.click(incomeCard!);

      expect(mockPush).toHaveBeenCalledWith("/transactions?tab=incomes");
    });

    it("예산 카드 클릭 시 설정 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      render(<StatsCards data={mockData} />);

      const budgetCard = screen.getByText("예산 남은 금액").closest("div")!
        .parentElement!.parentElement;
      await user.click(budgetCard!);

      expect(mockPush).toHaveBeenCalledWith("/settings");
    });

    it("가족 구성원 카드 클릭 시 설정 페이지로 이동한다", async () => {
      const user = userEvent.setup();
      render(<StatsCards data={mockData} />);

      const familyCard = screen.getByText("가족 구성원").closest("div")!
        .parentElement!.parentElement;
      await user.click(familyCard!);

      expect(mockPush).toHaveBeenCalledWith("/settings");
    });
  });

  describe("예산 계산", () => {
    it("예산 대비 지출 비율을 올바르게 계산한다", () => {
      render(<StatsCards data={mockData} />);

      // 500,000 / 800,000 * 100 = 62.5% → 63%
      expect(screen.getByText("63%")).toBeInTheDocument();
    });

    it("예산 초과 시 퍼센티지가 100%로 제한된다", () => {
      const overBudgetData = {
        ...mockData,
        monthlyExpense: 1000000,
        budget: 800000,
      };

      render(<StatsCards data={overBudgetData} />);

      // 1,000,000 / 800,000 * 100 = 125% → 100%로 제한
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("남은 예산 비율을 올바르게 계산한다", () => {
      render(<StatsCards data={mockData} />);

      // 300,000 / 800,000 * 100 = 37.5% → 38%
      expect(screen.getByText("38%")).toBeInTheDocument();
    });
  });

  describe("스타일링", () => {
    it("모든 카드에 cursor-pointer 클래스가 적용된다", () => {
      const { container } = render(<StatsCards data={mockData} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      cards.forEach((card) => {
        expect(card).toHaveClass("cursor-pointer");
      });
    });

    it("모든 카드에 호버 효과 클래스가 적용된다", () => {
      const { container } = render(<StatsCards data={mockData} />);

      const cards = container.querySelectorAll('[data-slot="card"]');
      cards.forEach((card) => {
        expect(card).toHaveClass("hover:scale-105");
        expect(card).toHaveClass("active:scale-95");
      });
    });

    it("예산 초과 시 빨간색 그라데이션이 적용된다", () => {
      const overBudgetData = {
        ...mockData,
        remainingBudget: -100000,
      };

      const { container } = render(<StatsCards data={overBudgetData} />);

      const budgetCard = screen.getByText("예산 초과").closest("div")!
        .parentElement!.parentElement;
      expect(budgetCard).toHaveClass("from-red-500");
    });

    it("예산이 남았을 때 주황색 그라데이션이 적용된다", () => {
      const { container } = render(<StatsCards data={mockData} />);

      const budgetCard = screen.getByText("예산 남은 금액").closest("div")!
        .parentElement!.parentElement;
      expect(budgetCard).toHaveClass("from-amber-500");
    });
  });
});
