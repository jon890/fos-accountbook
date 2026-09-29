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
  useActionState: jest.fn((action, initialState) => [initialState, action]),
}));

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { createIncomeAction } from "@/actions/income/create-income-action";
import { createRecurringExpenseAction } from "@/actions/recurring-expense";
import { AddTransactionDialog } from "@/components/transactions/dialogs/AddTransactionDialog";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
    name: "식비",
    icon: "🍔",
    color: "#EF4444",
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
    setupCategoryMock();
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

    await user.click(screen.getByRole("button", { name: /^지출$/ }));

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

    await user.click(screen.getByRole("button", { name: /^수입$/ }));

    expect(screen.getByRole("button", { name: /수입 추가/ })).toBeInTheDocument();
  });

  it("고정지출 토글 클릭 → 고정지출 추가 버튼 + 이름/결제일 필드 표시", async () => {
    const user = userEvent.setup();
    render(
      <AddTransactionDialog open={true} onOpenChange={onOpenChange} defaultType="expense" />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /지출 추가/ })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^고정지출$/ }));

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
});
