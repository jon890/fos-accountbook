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
  it("선택한 날의 지출과 수입을 시간순으로 보이고 서버의 지출 합계를 쓴다", () => {
    render(<DayTransactionList {...props} />);
    expect(screen.getByText("9월 14일 (월)")).toBeInTheDocument();
    expect(screen.getByText("₩43,000")).toBeInTheDocument();
    expect(screen.queryByText("다음 날 식사")).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("보너스")).toBeInTheDocument();
    expect(within(items[1]).getByText("점심")).toBeInTheDocument();
    expect(within(items[1]).getByText("아내")).toBeInTheDocument();
  });

  it("모르는 등록자는 이전 구성원과 회색 점으로 표시한다", () => {
    render(<DayTransactionList {...props} expenses={[calendarExpense({ userUuid: "left" })]} incomes={[]} />);
    expect(screen.getByText("이전 구성원")).toBeInTheDocument();
    expect(screen.getByText("이전 구성원").querySelector(".bg-neutral-500")).toBeInTheDocument();
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

  it("색이 없는 기존 등록자는 아바타 첫 글자를 유지한다", () => {
    render(<TransactionRow tx={{ ...calendarExpense(), createdBy: { name: "아내" } }} variant="compact" />);
    expect(screen.getByText("아")).toBeInTheDocument();
  });
});
