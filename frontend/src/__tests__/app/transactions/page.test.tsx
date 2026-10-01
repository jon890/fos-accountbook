import TransactionsPage from "@/app/(authenticated)/transactions/page";
import { getSelectedFamilyAction } from "@/actions/family/get-selected-family-action";
import { getFamilyMembersAction } from "@/actions/family/get-family-members-action";
import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { getExpensesAction } from "@/actions/expense/get-expenses-action";
import { getUserProfileAction } from "@/actions/user/get-user-profile-action";
import { getCachedSession } from "@/lib/server/cache";
import { getMonthRange } from "@/lib/utils/date-timezone";
import { redirect } from "next/navigation";

jest.mock("@/lib/server/cache", () => ({ getCachedSession: jest.fn() }));
jest.mock("@/lib/utils/date-timezone", () => ({ getMonthRange: jest.fn() }));
jest.mock("@/actions/family/get-selected-family-action", () => ({
  getSelectedFamilyAction: jest.fn(),
}));
jest.mock("@/actions/family/get-family-members-action", () => ({
  getFamilyMembersAction: jest.fn(),
}));
jest.mock("@/actions/category/get-categories-action", () => ({
  getFamilyCategoriesAction: jest.fn(),
}));
jest.mock("@/actions/expense/get-expenses-action", () => ({
  getExpensesAction: jest.fn(),
}));
jest.mock("@/actions/user/get-user-profile-action", () => ({
  getUserProfileAction: jest.fn(),
}));
jest.mock("@/actions/recurring-expense", () => ({
  getRecurringExpensesAction: jest.fn(),
}));
jest.mock("@/components/expenses/list/ExpenseList", () => ({
  ExpenseList: jest.fn(() => null),
}));
jest.mock("@/components/expenses/summary/ExpenseSummaryWrapper", () => ({
  ExpenseSummaryWrapper: jest.fn(() => null),
}));
jest.mock("@/components/incomes/list/IncomeList", () => ({
  IncomeList: jest.fn(() => null),
}));
jest.mock("@/components/recurring-expense/RecurringExpenseList", () => ({
  RecurringExpenseList: jest.fn(() => null),
}));
jest.mock("@/app/(authenticated)/transactions/_components/TransactionsPageClient", () => ({
  TransactionsPageClient: jest.fn(() => null),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("redirect");
  }),
}));

const mockGetSession = jest.mocked(getCachedSession);
const mockGetFamily = jest.mocked(getSelectedFamilyAction);
const mockGetMembers = jest.mocked(getFamilyMembersAction);
const mockGetCategories = jest.mocked(getFamilyCategoriesAction);
const mockGetMonthRange = jest.mocked(getMonthRange);

describe("내역 페이지", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: {
        userUuid: "user-1",
        profile: {
          timezone: "America/New_York",
          language: "ko",
          currency: "KRW",
          defaultFamilyUuid: "family-1",
        },
      },
      expires: "2026-10-01T00:00:00Z",
    });
    mockGetFamily.mockResolvedValue({ success: true, data: "family-1" });
    mockGetMembers.mockResolvedValue({
      success: true,
      data: [{ userUuid: "user-1", name: "민지", email: null, image: null, role: "OWNER", joinedAt: "2026-01-01" }],
    });
    mockGetCategories.mockResolvedValue({ success: true, data: [] });
    mockGetMonthRange.mockReturnValue({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  it.each(["expenses", "incomes", "recurring"] as const)(
    "%s 탭의 slot만 서버 컴포넌트를 전달한다",
    async (tab) => {
      const page = await TransactionsPage({
        searchParams: Promise.resolve({ tab }),
      });
      const slots = {
        expenses: page.props.expenseListContent,
        incomes: page.props.incomeListContent,
        recurring: page.props.recurringListContent,
      };

      expect(page.props.activeTab).toBe(tab);
      for (const [slotTab, content] of Object.entries(slots)) {
        if (slotTab === tab) {
          expect(content).not.toBeNull();
        } else {
          expect(content).toBeNull();
        }
      }
    },
  );

  it("탭을 생략하면 지출 slot만 전달한다", async () => {
    const page = await TransactionsPage({ searchParams: Promise.resolve({}) });

    expect(page.props.activeTab).toBe("expenses");
    expect(page.props.expenseListContent).not.toBeNull();
    expect(page.props.incomeListContent).toBeNull();
    expect(page.props.recurringListContent).toBeNull();
  });

  it.each(["unknown", "", "INCOMES", ["incomes", "recurring"]])(
    "잘못된 탭 %j는 지출 탭으로 정규화한다",
    async (tab) => {
      const page = await TransactionsPage({
        searchParams: Promise.resolve({ tab }),
      });

      expect(page.props.activeTab).toBe("expenses");
      expect(page.props.expenseListContent).not.toBeNull();
      expect(page.props.incomeListContent).toBeNull();
      expect(page.props.recurringListContent).toBeNull();
    },
  );

  it("수입 탭은 지출과 프로필을 조회하지 않고 세션 시간대를 사용한다", async () => {
    const page = await TransactionsPage({
      searchParams: Promise.resolve({ tab: "incomes" }),
    });

    expect(page.props.expenseListContent).toBeNull();
    expect(getExpensesAction).not.toHaveBeenCalled();
    expect(getUserProfileAction).not.toHaveBeenCalled();
    expect(mockGetMonthRange).toHaveBeenCalledWith("America/New_York");
    expect(page.props.searchParams).toMatchObject({
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
    expect(mockGetCategories).toHaveBeenCalledWith("family-1");
  });

  it.each([
    null,
    { user: { userUuid: "user-1" }, expires: "2026-10-01T00:00:00Z" },
  ])(
    "세션이나 프로필이 없으면 서울 시간대를 사용한다: %j",
    async (session) => {
      mockGetSession.mockResolvedValue(session);

      await TransactionsPage({ searchParams: Promise.resolve({}) });

      expect(mockGetMonthRange).toHaveBeenCalledWith("Asia/Seoul");
    },
  );

  it("선택한 가족이 없으면 가족 생성 화면으로 이동한다", async () => {
    mockGetFamily.mockResolvedValue({ success: true, data: null });

    await expect(
      TransactionsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");

    expect(redirect).toHaveBeenCalledWith("/families/create");
    expect(mockGetCategories).not.toHaveBeenCalled();
  });

  it.each([
    ["expenses", (page: Awaited<ReturnType<typeof TransactionsPage>>) => page.props.expenseListContent.props.children[1].props.children],
    ["incomes", (page: Awaited<ReturnType<typeof TransactionsPage>>) => page.props.incomeListContent.props.children],
  ] as const)("가족 구성원을 %s 목록에 전달한다", async (tab, getList) => {
    const page = await TransactionsPage({ searchParams: Promise.resolve({ tab }) });
    const list = getList(page);

    expect(list.props.members).toEqual([
      expect.objectContaining({ userUuid: "user-1", name: "민지" }),
    ]);
    expect(mockGetMembers).toHaveBeenCalledWith();
  });

  it("구성원 조회 실패 메시지를 페이지에 표시한다", async () => {
    mockGetMembers.mockResolvedValue({
      success: false,
      error: { code: "C003", message: "구성원 조회 실패" },
    });

    const page = await TransactionsPage({ searchParams: Promise.resolve({}) });

    expect(page.props.role).toBe("alert");
    expect(page.props.children).toBe("구성원 조회 실패");
  });

  it("구성원 조회 인증 실패는 로그인 화면으로 이동한다", async () => {
    mockGetMembers.mockResolvedValue({
      success: false,
      error: { code: "A002", message: "세션이 만료되었습니다" },
    });

    await expect(TransactionsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith(
      "/auth/signin?error=auth&message=%EC%84%B8%EC%85%98%EC%9D%B4%20%EB%A7%8C%EB%A3%8C%EB%90%98%EC%97%88%EC%8A%B5%EB%8B%88%EB%8B%A4",
    );
  });
});
