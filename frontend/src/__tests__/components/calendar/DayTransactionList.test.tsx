import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DayTransactionList } from "@/components/calendar/DayTransactionList";
import { buildMemberColorMap } from "@/lib/utils/member-color";
import { calendarExpense, calendarIncome, calendarMonth } from "@/test-fixtures/calendar";
import { TransactionRow } from "@/components/transactions/TransactionRow";

const data = calendarMonth();
const props = {
  selectedDate: "2026-09-14",
  expenseTotal: 43000,
  expenses: data.expenses,
  incomes: data.incomes,
  colors: buildMemberColorMap(data.members),
  onAdd: jest.fn(),
  onEdit: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("선택 날짜 거래 목록", () => {
  it("서비스가 연결한 카테고리 이름과 아이콘을 지출과 수입에 표시한다", () => {
    render(<DayTransactionList {...props}
      expenses={[calendarExpense({ category: { uuid: "category-1", name: "식비", icon: "🍚", color: "" } })]}
      incomes={[calendarIncome({ category: { uuid: "category-2", name: "급여", icon: "💰", color: "" } })]}
    />);
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "식비 · 아내 · 12:00")).toBeInTheDocument();
    expect(screen.getByText("🍚")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "급여 · 아내 · 09:00")).toBeInTheDocument();
    expect(screen.getByText("💰")).toBeInTheDocument();
    expect(screen.queryByText(/기타/)).not.toBeInTheDocument();
  });

  it.each([
    ["지출 자체", calendarExpense({ excludeFromBudget: true })],
    [
      "카테고리 유래",
      calendarExpense({
        category: { uuid: "category-1", name: "식비", icon: "🍚", color: "", excludeFromBudget: true },
      }),
    ],
  ])("%s 예산 제외 지출을 행에 표시한다", (_, expense) => {
    render(<DayTransactionList {...props} expenses={[expense]} incomes={[]} />);

    expect(screen.getByRole("button", { name: /예산 제외/ })).toBeInTheDocument();
  });

  it("일반 지출 행에는 예산 제외를 표시하지 않는다", () => {
    render(<DayTransactionList {...props} expenses={[calendarExpense()]} incomes={[]} />);

    expect(screen.queryByText("예산 제외")).not.toBeInTheDocument();
  });
  it("선택한 날의 지출과 수입을 시간순으로 보이고 서버의 지출 합계를 쓴다", () => {
    render(<DayTransactionList {...props} />);
    expect(screen.getByText("9월 14일 (월)")).toBeInTheDocument();
    expect(screen.getByText("₩43,000")).toBeInTheDocument();
    expect(screen.getAllByText("+₩50,000").some((element) => element.classList.contains("text-income"))).toBe(true);
    expect(screen.queryByText("다음 날 식사")).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("보너스")).toBeInTheDocument();
    expect(within(items[1]).getByText("점심")).toBeInTheDocument();
    expect(within(items[1]).getByText((_, element) => element?.tagName === "P" && element.textContent === "기타 · 아내 · 12:00")).toBeInTheDocument();
  });

  it("모르는 등록자는 이전 구성원과 회색 점으로 표시한다", () => {
    render(<DayTransactionList {...props} expenses={[calendarExpense({ userUuid: "left" })]} incomes={[]} />);
    const creatorDetail = screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "기타 · 이전 구성원 · 12:00");
    expect(creatorDetail).toBeInTheDocument();
    expect(creatorDetail.querySelector(".bg-neutral-500")).toBeInTheDocument();
  });

  it("빈 날에도 기록 추가 버튼을 사용할 수 있다", async () => {
    render(<DayTransactionList {...props} selectedDate="2026-09-30" />);
    expect(screen.getByText("이 날 기록이 없어요")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "이 날짜에 추가" }));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("지출과 수입 클릭은 종류와 원본 거래를 수정 대상으로 전달한다", async () => {
    render(<DayTransactionList {...props} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /점심/ }));
    expect(props.onEdit).toHaveBeenCalledWith({ type: "expense", transaction: data.expenses[0] });
    await user.click(screen.getByRole("button", { name: /보너스/ }));
    expect(props.onEdit).toHaveBeenCalledWith({ type: "income", transaction: calendarIncome() });
  });

  it.each(["compact", "full"] as const)("%s 행은 Enter와 Space로도 수정한다", async (variant) => {
    const onEdit = jest.fn();
    render(<TransactionRow tx={{ ...calendarExpense(), createdBy: { name: "아내", colorClass: "bg-member-1" } }} variant={variant} onEdit={onEdit} />);
    screen.getByRole("button").focus();
    await userEvent.setup().keyboard("{Enter} ");
    expect(onEdit).toHaveBeenCalledTimes(2);
  });

  it("색이 없는 기존 등록자도 보조 줄에 이름을 표시한다", () => {
    render(<TransactionRow tx={{ ...calendarExpense(), createdBy: { name: "아내" } }} variant="compact" />);
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "기타 · 아내 · 12:00")).toBeInTheDocument();
  });
});
