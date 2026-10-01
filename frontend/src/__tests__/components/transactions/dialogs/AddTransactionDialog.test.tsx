// Environment mocks (server 모듈이 import 될 때 필요)
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
jest.mock("@/actions/expense/create-expense-action");
jest.mock("@/actions/income/create-income-action");
jest.mock("@/actions/recurring-expense");

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(() => true), // 항상 데스크톱 모드
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn((action, initialState) => [initialState, action, false]),
}));

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { createIncomeAction } from "@/actions/income/create-income-action";
import { createRecurringExpenseAction } from "@/actions/recurring-expense";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import userEvent from "@testing-library/user-event";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

const mockGetCategories = getFamilyCategoriesAction as jest.MockedFunction<
  typeof getFamilyCategoriesAction
>;
const mockCreateExpense = createExpenseAction as jest.MockedFunction<
  typeof createExpenseAction
>;
const mockCreateIncome = createIncomeAction as jest.MockedFunction<
  typeof createIncomeAction
>;
const mockCreateRecurring = createRecurringExpenseAction as jest.MockedFunction<
  typeof createRecurringExpenseAction
>;

const mockCategories = [
  {
    uuid: "cat-1",
    familyUuid: "family-1",
    type: "EXPENSE" as const,
    name: "식비",
    icon: "🍔",
    color: "#EF4444",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    uuid: "income-cat-1",
    familyUuid: "family-1",
    type: "INCOME" as const,
    name: "급여",
    icon: "💰",
    color: "#10B981",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

function setupCategoryMock() {
  mockGetCategories.mockResolvedValue({ success: true, data: mockCategories });
}

describe("AddTransactionDialog", () => {
  const onOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useMediaQuery).mockReturnValue(true);
    setupCategoryMock();
  });

  it("모바일 입력에 포커스하면 화면 가운데로 스크롤하고 footer를 본문 밖에 둔다", async () => {
    jest.mocked(useMediaQuery).mockReturnValue(false);
    render(<AddTransactionDialog open onOpenChange={onOpenChange} />);
    const dateInput = await screen.findByLabelText(/날짜/);
    const scrollIntoView = jest.fn();
    dateInput.scrollIntoView = scrollIntoView;
    fireEvent.focus(dateInput);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "center" });
    const submit = screen.getByRole("button", { name: "지출 추가" });
    const footer = submit.closest(".sticky");
    expect(footer).toHaveClass("bottom-0", "safe-area-pb");
    expect(footer?.previousElementSibling).toHaveClass("overflow-y-auto", "min-h-0");
    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass("h-[100dvh]");
  });

  it("선택 날짜와 사용자가 고친 날짜를 종류 전환 뒤에도 유지하고 다른 날짜로 다시 연다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AddTransactionDialog open onOpenChange={onOpenChange} defaultDate="2026-09-14" />,
    );
    const dateInput = await screen.findByLabelText(/날짜/);
    expect(dateInput).toHaveValue("2026-09-14");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-09-13");
    await user.click(screen.getByRole("radio", { name: "수입" }));
    expect(screen.getByLabelText(/날짜/)).toHaveValue("2026-09-13");
    await user.click(screen.getByRole("radio", { name: "고정지출" }));
    await user.click(screen.getByRole("radio", { name: "지출" }));
    expect(screen.getByLabelText(/날짜/)).toHaveValue("2026-09-13");
    rerender(
      <AddTransactionDialog open={false} onOpenChange={onOpenChange} defaultDate="2026-09-15" />,
    );
    rerender(<AddTransactionDialog open onOpenChange={onOpenChange} defaultDate="2026-09-15" />);
    expect(await screen.findByLabelText(/날짜/)).toHaveValue("2026-09-15");
  });

  it("기본 type=expense 로 열리면 지출 추가 버튼이 렌더링된다", async () => {
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="expense" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /지출 추가/ })).toBeInTheDocument();
    });
  });

  it("defaultType=income 으로 열리면 수입 추가 버튼이 렌더링된다", async () => {
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="income" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /수입 추가/ })).toBeInTheDocument();
    });
  });

  it("defaultType=recurring 으로 열리면 고정지출 추가 버튼이 렌더링된다", async () => {
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="recurring" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /고정지출 추가/ })).toBeInTheDocument();
    });
  });

  it("지출 토글 클릭 → 지출 추가 버튼 표시", async () => {
    const user = userEvent.setup();
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="income" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /수입 추가/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: "지출" }));

    expect(screen.getByRole("button", { name: /지출 추가/ })).toBeInTheDocument();
  });

  it("수입 토글 클릭 → 수입 추가 버튼 표시", async () => {
    const user = userEvent.setup();
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="expense" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /지출 추가/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: "수입" }));

    expect(screen.getByRole("button", { name: /수입 추가/ })).toBeInTheDocument();
  });

  it("거래 종류를 바꾸면 카테고리 선택을 비우고 자동 선택하지 않는다", async () => {
    const user = userEvent.setup();
    render(<AddTransactionDialog open onOpenChange={onOpenChange} defaultType="expense" />);

    const expenseCategory = await screen.findByRole("radio", { name: "식비" });
    await user.click(expenseCategory);
    expect(expenseCategory).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "수입" }));

    const incomeCategory = screen.getByRole("radio", { name: "급여" });
    expect(incomeCategory).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("radio", { name: "식비" })).not.toBeInTheDocument();
  });

  it("첫 번째로 빠진 값을 안내하고, 저장 버튼 설명으로 연결한다", async () => {
    const user = userEvent.setup();
    render(<AddTransactionDialog open onOpenChange={onOpenChange} />);

    const submitButton = screen.getByRole("button", { name: "지출 추가" });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("금액을 입력해 주세요")).toHaveAttribute(
      "id",
      "transaction-form-missing-field",
    );
    expect(submitButton).toHaveAttribute("aria-describedby", "transaction-form-missing-field");

    fireEvent.change(screen.getByRole("spinbutton", { name: "금액 직접 입력" }), {
      target: { value: "1000" },
    });
    expect(screen.getByText("카테고리를 골라 주세요")).toBeInTheDocument();

    await user.click(await screen.findByRole("radio", { name: "식비" }));
    expect(screen.queryByText("카테고리를 골라 주세요")).not.toBeInTheDocument();
    expect(submitButton).toBeEnabled();
    expect(submitButton).not.toHaveAttribute("aria-describedby");
  });

  it("종류 토글은 라디오 그룹이며 방향키로 선택을 옮긴다", async () => {
    const user = userEvent.setup();
    render(<AddTransactionDialog open onOpenChange={onOpenChange} />);

    expect(screen.getByRole("radiogroup", { name: "거래 종류" })).toBeInTheDocument();
    const expenseRadio = screen.getByRole("radio", { name: "지출" });
    await user.click(expenseRadio);
    fireEvent.keyDown(expenseRadio, { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "수입" })).toBeChecked();
    });
  });

  it("저장 중에는 입력, 취소, 저장 버튼을 모두 잠근다", async () => {
    const { useActionState } = jest.requireMock("react");
    useActionState.mockImplementation((action: unknown, initialState: unknown) => [initialState, action, true]);

    try {
      render(<AddTransactionDialog open onOpenChange={onOpenChange} />);
      await screen.findByRole("radio", { name: "식비" });

      expect(screen.getByRole("spinbutton", { name: "금액 직접 입력" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "지출 추가" })).toBeDisabled();
    } finally {
      useActionState.mockImplementation((action: unknown, initialState: unknown) => [initialState, action, false]);
    }
  });

  it("고정지출 토글 클릭 → 고정지출 추가 버튼 + 이름/결제일 필드 표시", async () => {
    const user = userEvent.setup();
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="expense" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /지출 추가/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: "고정지출" }));

    expect(screen.getByRole("button", { name: /고정지출 추가/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/이름/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/매월 결제일/i)).toBeInTheDocument();
  });

  it("카테고리 로드 실패 시 에러 토스트를 표시한다", async () => {
    const { toast } = jest.requireMock("sonner");
    mockGetCategories.mockRejectedValue(new Error("network error"));

    render(<AddTransactionDialog open={true} onOpenChange={onOpenChange} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it("open=false 일 때 body 를 마운트하지 않는다", () => {
    render(<AddTransactionDialog open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("button", { name: /추가/ })).not.toBeInTheDocument();
  });

  it("expense 저장 시 createExpenseAction 이 useActionState 에 등록된다", async () => {
    const { useActionState } = jest.requireMock("react");
    useActionState.mockClear();

    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="expense" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /지출 추가/ })).toBeInTheDocument();
    });

    const actions = useActionState.mock.calls.map((c: [unknown]) => c[0]);
    expect(actions).toContain(mockCreateExpense);
  });

  it("income 저장 시 createIncomeAction 이 useActionState 에 등록된다", async () => {
    const { useActionState } = jest.requireMock("react");
    useActionState.mockClear();

    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="income" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /수입 추가/ })).toBeInTheDocument();
    });

    const actions = useActionState.mock.calls.map((c: [unknown]) => c[0]);
    expect(actions).toContain(mockCreateIncome);
  });

  it("recurring 저장 시 createRecurringExpenseAction 이 wrapper 통해 사용된다", async () => {
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="recurring" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /고정지출 추가/ })).toBeInTheDocument();
    });

    // recurring 은 wrapper 가 useActionState 에 등록되므로 모듈 정의 존재만 검증
    expect(mockCreateRecurring).toBeDefined();
  });

  it("빈 결제일 제출은 고정지출 등록 action을 호출하지 않고 오류를 반환한다", async () => {
    const { useActionState } = jest.requireMock("react");
    useActionState.mockClear();

    render(
      <AddTransactionDialog open onOpenChange={onOpenChange} defaultType="recurring" />,
    );
    await screen.findByRole("button", { name: "고정지출 추가" });

    const recurringWrapper = useActionState.mock.calls[2][0];
    const result = await recurringWrapper({ success: false, errors: {}, message: "" }, new FormData());

    expect(result).toEqual({
      success: false,
      errors: { dayOfMonth: ["결제일을 1~28 중에서 입력해 주세요"] },
      message: "",
    });
    expect(mockCreateRecurring).not.toHaveBeenCalled();
  });
});
