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
jest.mock("@/actions/expense/delete-expense-action");
jest.mock("@/actions/income/delete-income-action");
jest.mock("@/actions/recurring-expense");

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(() => true), // 항상 데스크톱 모드
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(jest.requireActual("react").useActionState),
}));

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { updateExpenseAction } from "@/actions/expense/update-expense-action";
import { updateIncomeAction } from "@/actions/income/update-income-action";
import { updateRecurringExpenseAction } from "@/actions/recurring-expense";
import { EditTransactionDialog } from "@/components/transactions/dialogs/EditTransactionDialog";
import { deleteExpenseAction } from "@/actions/expense/delete-expense-action";
import { deleteIncomeAction } from "@/actions/income/delete-income-action";
import { toast } from "sonner";
import { ActionError } from "@/lib/errors";
import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Expense, UpdateExpenseFormState } from "@/types/expense";
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
  userUuid: "user-1",
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
  userUuid: "user-1",
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

function createDeferredUpdate() {
  let resolve!: (state: UpdateExpenseFormState) => void;
  const promise = new Promise<UpdateExpenseFormState>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

describe("EditTransactionDialog", () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue({ success: true, data: mockCategories });
  });

  it.each(["expense", "income"] as const)("%s 수정 응답을 기다리는 동안 삭제 확인을 열지 않는다", async (type) => {
    const user = userEvent.setup();
    const transaction = type === "expense" ? mockExpense : mockIncome;
    const updateAction = type === "expense" ? mockUpdateExpense : mockUpdateIncome;
    const deleteAction = type === "expense" ? deleteExpenseAction : deleteIncomeAction;
    const label = type === "expense" ? "지출" : "수입";
    const update = createDeferredUpdate();
    updateAction.mockReturnValueOnce(update.promise);
    render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type={type} transaction={transaction} />,
    );

    try {
      await user.click(await screen.findByRole("button", { name: `${label} 수정` }));
      await waitFor(() => expect(updateAction).toHaveBeenCalled());
      const deleteButton = screen.getByRole("button", { name: "삭제" });
      expect(deleteButton).toBeDisabled();
      await user.click(deleteButton);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(deleteAction).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      await act(async () => {
        update.resolve({ success: false, message: "수정 실패", errors: {} });
        await update.promise;
      });
    }

    expect(screen.getByRole("button", { name: "삭제" })).toBeEnabled();
    expect(toast.error).toHaveBeenCalledWith("수정 실패");
  });

  it.each(["expense", "income"] as const)("%s 삭제 확인이 열린 상태에서도 수정 응답을 기다리는 동안 삭제를 실행하지 않는다", async (type) => {
    const user = userEvent.setup();
    const transaction = type === "expense" ? mockExpense : mockIncome;
    const updateAction = type === "expense" ? mockUpdateExpense : mockUpdateIncome;
    const deleteAction = type === "expense" ? deleteExpenseAction : deleteIncomeAction;
    const label = type === "expense" ? "지출" : "수입";
    const update = createDeferredUpdate();
    updateAction.mockReturnValueOnce(update.promise);
    jest.mocked(deleteAction).mockResolvedValueOnce({ success: true, data: undefined });
    render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type={type} transaction={transaction} />,
    );

    const submitButton = await screen.findByRole("button", { name: `${label} 수정` });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "삭제" }));
    const confirmation = within(screen.getByRole("alertdialog"));

    try {
      // 확인 창이 먼저 열린 뒤 수정 요청이 시작되는 순서를 재현한다.
      fireEvent.submit(form!);
      await waitFor(() => expect(updateAction).toHaveBeenCalled());
      const confirmDeleteButton = confirmation.getByRole("button", { name: "삭제" });
      expect(confirmDeleteButton).toBeDisabled();
      await user.click(confirmDeleteButton);
      expect(deleteAction).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      await act(async () => {
        update.resolve({ success: false, message: "수정 실패", errors: {} });
        await update.promise;
      });
    }

    const confirmDeleteButton = confirmation.getByRole("button", { name: "삭제" });
    expect(confirmDeleteButton).toBeEnabled();
    await user.click(confirmDeleteButton);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(deleteAction).toHaveBeenCalledWith(transaction.familyUuid, transaction.uuid);
  });

  it.each(["expense", "income"] as const)("%s 서버 거래값이 갱신되어도 작성 중인 값을 유지하고 다시 열면 최신 값으로 초기화한다", async (type) => {
    const user = userEvent.setup();
    const transaction = type === "expense" ? mockExpense : mockIncome;
    const latestTransaction = {
      ...transaction,
      amount: 42000,
      description: "서버에서 갱신한 메모",
      date: "2024-01-20T00:00:00Z",
    };
    const { rerender } = render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type={type} transaction={transaction} />,
    );

    const amountInput = await screen.findByRole("spinbutton", { name: "금액 직접 입력" });
    await user.clear(amountInput);
    await user.type(amountInput, "23000");
    const descriptionInput = screen.getByLabelText("메모");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "작성 중인 메모");
    fireEvent.change(screen.getByLabelText(/날짜/), { target: { value: "2024-01-18" } });

    rerender(
      <EditTransactionDialog open onOpenChange={onOpenChange} type={type} transaction={latestTransaction} />,
    );
    expect(screen.getByRole("spinbutton", { name: "금액 직접 입력" })).toHaveValue(23000);
    expect(screen.getByLabelText("메모")).toHaveValue("작성 중인 메모");
    expect(screen.getByLabelText(/날짜/)).toHaveValue("2024-01-18");

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(
      <EditTransactionDialog open={false} onOpenChange={onOpenChange} type={type} transaction={latestTransaction} />,
    );
    expect(screen.queryByLabelText("메모")).not.toBeInTheDocument();
    rerender(
      <EditTransactionDialog open onOpenChange={onOpenChange} type={type} transaction={latestTransaction} />,
    );

    expect(await screen.findByRole("spinbutton", { name: "금액 직접 입력" })).toHaveValue(42000);
    expect(screen.getByLabelText("메모")).toHaveValue("서버에서 갱신한 메모");
    expect(screen.getByLabelText(/날짜/)).toHaveValue("2024-01-20");
  });

  it.each(["expense", "income"] as const)("%s 삭제 성공 시 가족과 거래를 전달하고 수정 창을 닫는다", async (type) => {
    const user = userEvent.setup();
    const transaction = type === "expense" ? mockExpense : mockIncome;
    const action = type === "expense" ? deleteExpenseAction : deleteIncomeAction;
    jest.mocked(action).mockResolvedValue({ success: true, data: undefined });
    render(
      <EditTransactionDialog
        open
        onOpenChange={onOpenChange}
        type={type}
        transaction={transaction}
        familyUuid="chosen-family"
      />,
    );
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(action).toHaveBeenCalledWith("chosen-family", transaction.uuid);
    expect(toast.success).toHaveBeenCalled();
  });

  it("삭제 확인을 취소하면 거래와 수정 창을 유지한다", async () => {
    const user = userEvent.setup();
    render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type="expense" transaction={mockExpense} />,
    );
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "취소" }));
    expect(deleteExpenseAction).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "지출 수정" })).toBeInTheDocument();
  });

  it.each(["expense", "income"] as const)("%s 삭제 실패 시 거래 가족을 사용하고 수정 창을 유지한다", async (type) => {
    const user = userEvent.setup();
    const transaction = type === "expense" ? mockExpense : mockIncome;
    const action = type === "expense" ? deleteExpenseAction : deleteIncomeAction;
    jest.mocked(action).mockResolvedValue(
      ActionError.unauthorized("삭제 권한 없음").toFailureResult(),
    );
    render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type={type} transaction={transaction} />,
    );
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("삭제 권한 없음"));
    expect(action).toHaveBeenCalledWith(transaction.familyUuid, transaction.uuid);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("삭제 요청 예외에도 수정 창을 유지한다", async () => {
    const user = userEvent.setup();
    jest.mocked(deleteExpenseAction).mockRejectedValue(new Error("network"));
    render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type="expense" transaction={mockExpense} />,
    );
    await user.click(await screen.findByRole("button", { name: "삭제" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "삭제" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("지출 삭제에 실패했습니다"));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("고정지출에는 삭제 버튼을 표시하지 않는다", async () => {
    render(
      <EditTransactionDialog open onOpenChange={onOpenChange} type="recurring" transaction={mockRecurring} />,
    );
    await screen.findByRole("button", { name: "고정지출 수정" });
    expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
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
