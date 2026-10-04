import { render, screen, within } from "@testing-library/react";
import { InstallmentList } from "@/components/installment/InstallmentList";
import type { Installment } from "@/types/installment";

jest.mock("@/actions/installment/create-installment-action", () => ({
  createInstallmentAction: jest.fn(),
}));
jest.mock("@/actions/installment/update-installment-action", () => ({
  updateInstallmentAction: jest.fn(),
}));
jest.mock("@/actions/installment/delete-installment-action", () => ({
  deleteInstallmentAction: jest.fn(),
}));
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn().mockReturnValue(true),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/client/navigation", () => ({
  useAppRouter: () => ({ refresh: jest.fn() }),
}));

function installment(overrides: Partial<Installment>): Installment {
  return {
    uuid: "00000000-0000-4000-8000-000000000001",
    userUuid: "user-1",
    name: "노트북",
    totalAmount: 1000000,
    installmentMonths: 12,
    startMonth: "2026-09",
    endMonth: "2027-08",
    memo: null,
    monthlyAmount: 83333,
    firstMonthAmount: 83337,
    currentRound: 2,
    thisMonthAmount: 83333,
    remainingAmount: 833330,
    progress: "IN_PROGRESS",
    createdAt: "2026-09-01T00:00:00",
    updatedAt: "2026-09-01T00:00:00",
    ...overrides,
  };
}

const items = [
  installment({}),
  installment({
    uuid: "00000000-0000-4000-8000-000000000002",
    name: "냉장고",
    totalAmount: 500000,
    installmentMonths: 3,
    startMonth: "2026-11",
    currentRound: 0,
    thisMonthAmount: 0,
    remainingAmount: 500000,
    progress: "UPCOMING",
  }),
  installment({
    uuid: "00000000-0000-4000-8000-000000000003",
    name: "청소기",
    totalAmount: 600000,
    installmentMonths: 6,
    currentRound: 6,
    thisMonthAmount: 0,
    remainingAmount: 0,
    progress: "COMPLETED",
  }),
];

describe("InstallmentList", () => {
  it("요약 합계를 목록에서 더해 보여준다", () => {
    render(<InstallmentList items={items} defaultStartMonth="2026-10" />);

    expect(screen.getByText("₩83,333", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/남은 할부 ₩1,333,330/)).toBeInTheDocument();
  });

  it("완료 항목만 완료 제목 아래에 둔다", () => {
    render(<InstallmentList items={items} defaultStartMonth="2026-10" />);

    const heading = screen.getByRole("heading", { name: "완료" });
    const card = heading.parentElement as HTMLElement;
    expect(within(card).getByText("청소기")).toBeInTheDocument();
    expect(within(card).queryByText("노트북")).not.toBeInTheDocument();
    expect(within(card).queryByText("냉장고")).not.toBeInTheDocument();
  });

  it("진행 상태별 보조 문구를 보여준다", () => {
    render(<InstallmentList items={items} defaultStartMonth="2026-10" />);

    expect(screen.getByText("2/12회 · 월 ₩83,333")).toBeInTheDocument();
    expect(screen.getByText("2026년 11월 시작 · 3개월")).toBeInTheDocument();
    expect(screen.getByText("완납 · 6개월")).toBeInTheDocument();
  });

  it("빈 배열이면 빈 상태와 추가 버튼을 보이고 완료 제목은 없다", () => {
    render(<InstallmentList items={[]} defaultStartMonth="2026-10" />);

    expect(screen.getByText("등록된 할부가 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "할부 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "완료" })).not.toBeInTheDocument();
  });
});
