import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { buildMemberColorMap } from "@/lib/utils/member-color";
import { calendarMonth } from "@/test-fixtures/calendar";

const data = calendarMonth();

describe("달력 날짜 칸", () => {
  function renderGrid(dailyStats = data.daily.dailyStats) {
    const onSelect = jest.fn();
    render(<CalendarGrid year={2026} month={9} dailyStats={dailyStats} colors={buildMemberColorMap(data.members)} selectedDate="2026-09-14" today="2026-09-15" onSelect={onSelect} />);
    return onSelect;
  }

  it("같은 날 두 구성원의 지출을 각각 줄인 금액과 색 점으로 표시한다", () => {
    renderGrid();
    const cell = screen.getByRole("button", { name: "9월 14일, 아내 32,000원, 남편 11,000원" });
    expect(within(cell).getByText("3.2만")).toBeInTheDocument();
    expect(within(cell).getByText("1.1만")).toBeInTheDocument();
    expect(cell.querySelector(".bg-member-1")).toBeInTheDocument();
    expect(cell.querySelector(".bg-member-2")).toBeInTheDocument();
    expect(cell).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "9월 15일" }).querySelector(".border-brand-500")).toBeInTheDocument();
  });

  it("날짜를 누르면 선택한 실제 날짜를 전달한다", async () => {
    const onSelect = renderGrid();
    await userEvent.setup().click(screen.getByRole("button", { name: "9월 30일" }));
    expect(onSelect).toHaveBeenCalledWith("2026-09-30");
    expect(screen.queryByRole("button", { name: "9월 31일" })).not.toBeInTheDocument();
  });

  it("세 명 이상이면 지출이 큰 두 명과 나머지 수를 표시하고 모든 구성원을 읽는다", () => {
    renderGrid([{ date: "2026-09-14", income: 0, expense: 45000, memberExpenses: [{ userUuid: "old", amount: 2000 }, { userUuid: "husband", amount: 11000 }, { userUuid: "wife", amount: 32000 }] }]);
    const cell = screen.getByRole("button", { name: "9월 14일, 아내 32,000원, 남편 11,000원, 이전 구성원 2,000원" });
    expect(within(cell).getByText("+1")).toBeInTheDocument();
    expect(within(cell).queryByText("2천")).not.toBeInTheDocument();
  });

  it("윤년 2월의 29일을 표시한다", () => {
    render(<CalendarGrid year={2024} month={2} dailyStats={[]} colors={new Map()} selectedDate="2024-02-29" today="2026-09-15" onSelect={jest.fn()} />);
    expect(screen.getByRole("button", { name: "2월 29일" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "2월 30일" })).not.toBeInTheDocument();
  });
});
