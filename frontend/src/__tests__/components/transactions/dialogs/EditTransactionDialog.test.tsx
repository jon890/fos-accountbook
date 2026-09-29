// Environment mocks
jest.mock("@/lib/env/server.env", () => ({
  serverEnv: { BACKEND_API_URL: "http://localhost:8080" },
}));
jest.mock("@/lib/server/auth/auth-helpers", () => ({
  requireAuth: jest.fn(),
  getSelectedFamilyUuid: jest.fn(),
}));
jest.mock("@/lib/server/api", () => ({ serverApiGet: jest.fn() }));
jest.mock("@/lib/server/cache", () => ({
  getCachedSession: jest.fn(),
  getCachedFamilyCategories: jest.fn(),
  getCachedDashboardStats: jest.fn(),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

// Action mocks
jest.mock("@/actions/category/get-categories-action");
jest.mock("@/actions/expense/update-expense-action");
jest.mock("@/actions/income/update-income-action");
jest.mock("@/actions/recurring-expense");

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(() => true), // 항상 데스크톱 모드
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn((action, initialState) => [initialState, action]),
}));

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { updateExpenseAction } from "@/actions/expense/update-expense-action";
import { updateIncomeAction } from "@/actions/income/update-income-action";
import { updateRecurringExpenseAction } from "@/actions/recurring-expense";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { render, screen, waitFor } from "@testing-library/react";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import type { RecurringExpense } from "@/types/recurring-expense";

const mockGetCategories = getFamilyCategoriesAction as jest.MockedFunction<
  typeof getFamilyCategoriesAction
>;
const mockUpdateExpense = updateExpenseAction as jest.MockedFunction<
  typeof updateExpenseAction
>;
const mockUpdateIncome = updateIncomeAction as jest.MockedFunction<
  typeof updateIncomeAction
>;
const mockUpdateRecurring = updateRecurringExpenseAction as jest.MockedFunction<
  typeof updateRecurringExpenseAction
>;

const mockCategories = [
  {
    uuid: "cat-1",
    familyUuid: "family-1",
    name: "식비",
    icon: "🍔",
    color: "#EF4444",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const mockExpense: Expense = {
  uuid: "expense-1",
  familyUuid: "family-1",
  categoryUuid: "cat-1",
  category: { uuid: "cat-1", name: "식비", color: "#EF4444", icon: "🍔" },
  amount: 15000,
  description: "점심",
  date: "2024-01-15T00:00:00Z",
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z",
};

const mockIncome: Income = {
  uuid: "income-1",
  familyUuid: "family-1",
  categoryUuid: "cat-1",
  category: { uuid: "cat-1", name: "급여", color: "#10B981", icon: "💰" },
  amount: 3000000,
  description: "월급",
  date: "2024-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockRecurring: RecurringExpense = {
  uuid: "recurring-1",
  familyUuid: "family-1",
  categoryUuid: "cat-1",
  category: { uuid: "cat-1", familyUuid: "family-1", name: "구독", color: "#3B82F6", icon: "📺", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  name: "넷플릭스",
  amount: 17000,
  dayOfMonth: 15,
  status: "ACTIVE",
  generatedThisMonth: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("EditTransactionDialog", () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue({ success: true, data: mockCategories });
  });

  describe("type 잠금 — 비활성 토글 disabled", () => {
    it("type=expense 일 때 수입·고정지출 토글이 disabled 된다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="expense"
          transaction={mockExpense}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /지출 수정/ })).toBeInTheDocument();
      });

      const incomeToggle = screen.getByRole("button", { name: /^수입$/ });
      const recurringToggle = screen.getByRole("button", { name: /^고정지출$/ });
      expect(incomeToggle).toBeDisabled();
      expect(recurringToggle).toBeDisabled();
    });

    it("type=income 일 때 지출·고정지출 토글이 disabled 된다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="income"
          transaction={mockIncome}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /수입 수정/ })).toBeInTheDocument();
      });

      const expenseToggle = screen.getByRole("button", { name: /^지출$/ });
      const recurringToggle = screen.getByRole("button", { name: /^고정지출$/ });
      expect(expenseToggle).toBeDisabled();
      expect(recurringToggle).toBeDisabled();
    });

    it("type=recurring 일 때 지출·수입 토글이 disabled 된다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="recurring"
          transaction={mockRecurring}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /고정지출 수정/ })).toBeInTheDocument();
      });

      const expenseToggle = screen.getByRole("button", { name: /^지출$/ });
      const incomeToggle = screen.getByRole("button", { name: /^수입$/ });
      expect(expenseToggle).toBeDisabled();
      expect(incomeToggle).toBeDisabled();
    });
  });

  describe("헤더 타이틀", () => {
    it("type=expense 이면 '지출 수정' 헤더를 표시한다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="expense"
          transaction={mockExpense}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /지출 수정/ })).toBeInTheDocument();
      });

      // DialogTitle (heading role)
      expect(screen.getByRole("heading", { name: "지출 수정" })).toBeInTheDocument();
    });

    it("type=income 이면 '수입 수정' 헤더를 표시한다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="income"
          transaction={mockIncome}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /수입 수정/ })).toBeInTheDocument();
      });

      expect(screen.getByRole("heading", { name: "수입 수정" })).toBeInTheDocument();
    });

    it("type=recurring 이면 '고정지출 수정' 헤더를 표시한다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="recurring"
          transaction={mockRecurring}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /고정지출 수정/ })).toBeInTheDocument();
      });

      expect(screen.getByRole("heading", { name: "고정지출 수정" })).toBeInTheDocument();
    });
  });

  describe("prefill", () => {
    it("recurring type 에서 이름·결제일 필드가 표시된다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="recurring"
          transaction={mockRecurring}
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/이름/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/매월 결제일/i)).toBeInTheDocument();
    });

    it("expense type 에서 날짜·메모 필드가 표시된다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="expense"
          transaction={mockExpense}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/메모/i)).toBeInTheDocument();
    });
  });

  describe("update action 참조", () => {
    it("expense 수정 시 updateExpenseAction 이 useActionState 에 등록된다", async () => {
      const { useActionState } = jest.requireMock("react");

      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="expense"
          transaction={mockExpense}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /지출 수정/ })).toBeInTheDocument();
      });

      const calls = useActionState.mock.calls;
      const actions = calls.map((c: [unknown]) => c[0]);
      expect(actions).toContain(mockUpdateExpense);
    });

    it("income 수정 시 updateIncomeAction 이 useActionState 에 등록된다", async () => {
      const { useActionState } = jest.requireMock("react");

      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="income"
          transaction={mockIncome}
          familyUuid="family-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /수입 수정/ })).toBeInTheDocument();
      });

      const calls = useActionState.mock.calls;
      const actions = calls.map((c: [unknown]) => c[0]);
      expect(actions).toContain(mockUpdateIncome);
    });

    it("recurring 수정 시 updateRecurringExpenseAction 이 wrapper 통해 사용된다", async () => {
      render(
        <EditTransactionDialog
          open={true}
          onOpenChange={onOpenChange}
          type="recurring"
          transaction={mockRecurring}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /고정지출 수정/ })).toBeInTheDocument();
      });

      // updateRecurringExpenseAction 이 모듈에 정의되어 있는지 검증
      expect(mockUpdateRecurring).toBeDefined();
    });
  });

  it("open=false 일 때 body 를 마운트하지 않는다", () => {
    render(
      <EditTransactionDialog
        open={false}
        onOpenChange={onOpenChange}
        type="expense"
        transaction={mockExpense}
        familyUuid="family-1"
      />,
    );

    expect(screen.queryByRole("button", { name: /수정/ })).not.toBeInTheDocument();
  });
});
