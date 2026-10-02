import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { createBudgetItemAction } from "@/actions/budget-item/create-budget-item-action";
import { deleteBudgetItemAction } from "@/actions/budget-item/delete-budget-item-action";
import { updateBudgetItemAction } from "@/actions/budget-item/update-budget-item-action";
import { BudgetItemsSection } from "@/app/(authenticated)/budget/_components/BudgetItemsSection";
import type { BudgetItem } from "@/types/budget-item";
import type { CategoryResponse } from "@/types/category";

jest.mock("@/actions/budget-item/create-budget-item-action", () => ({
  createBudgetItemAction: jest.fn(),
}));
jest.mock("@/actions/budget-item/update-budget-item-action", () => ({
  updateBudgetItemAction: jest.fn(),
}));
jest.mock("@/actions/budget-item/delete-budget-item-action", () => ({
  deleteBudgetItemAction: jest.fn(),
}));
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn().mockReturnValue(true),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function category(n: number, name: string): CategoryResponse {
  return {
    uuid: uuid(n),
    familyUuid: "family-1",
    type: "EXPENSE",
    name,
    icon: null,
    createdAt: "2026-10-01T00:00:00",
    updatedAt: "2026-10-01T00:00:00",
  };
}

function item(n: number, name: string, limit: number, categoryUuids: string[]): BudgetItem {
  return {
    uuid: uuid(100 + n),
    name,
    monthlyLimit: limit,
    categoryUuids,
    createdAt: "2026-10-01T00:00:00",
    updatedAt: "2026-10-01T00:00:00",
  };
}

const categories = [category(1, "식비"), category(2, "간식"), category(3, "택시")];
const items = [
  item(1, "남편 용돈", 400000, [uuid(1)]),
  item(2, "아내 용돈", 0, [uuid(2)]),
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("BudgetItemsSection", () => {
  it("항목의 이름, 한도, 카테고리 이름을 보인다", () => {
    render(<BudgetItemsSection items={items} expenseCategories={categories} failed={false} />);

    expect(screen.getByText("남편 용돈")).toBeInTheDocument();
    expect(screen.getByText("₩400,000")).toBeInTheDocument();
    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.getByText("한도 없음")).toBeInTheDocument();
  });

  it("항목 추가 대화상자에서 입력해 저장하면 생성 액션을 부른다", async () => {
    const user = userEvent.setup();
    jest.mocked(createBudgetItemAction).mockResolvedValue({ success: true, data: items[0] });
    render(<BudgetItemsSection items={items} expenseCategories={categories} failed={false} />);

    await user.click(screen.getByRole("button", { name: "항목 추가" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("이름"), "여행");
    await user.type(within(dialog).getByLabelText("월 한도 (원)"), "50000");
    await user.click(within(dialog).getByRole("button", { name: "택시" }));
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(createBudgetItemAction).toHaveBeenCalledWith({
        name: "여행",
        monthlyLimit: 50000,
        categoryUuids: [uuid(3)],
      })
    );
    expect(toast.success).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("다른 항목이 쓰는 카테고리 버튼은 비활성이고, 수정 중인 항목 자신의 카테고리는 고를 수 있다", async () => {
    const user = userEvent.setup();
    render(<BudgetItemsSection items={items} expenseCategories={categories} failed={false} />);

    await user.click(screen.getByRole("button", { name: "항목 추가" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: /식비/ })).toBeDisabled();
    expect(within(dialog).getAllByText("다른 항목에 있음")).toHaveLength(2);
    expect(within(dialog).getByRole("button", { name: "택시" })).toBeEnabled();
    await user.click(within(dialog).getByRole("button", { name: "취소" }));

    await user.click(screen.getByRole("button", { name: "남편 용돈 수정" }));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "식비" })).toBeEnabled();
    expect(within(dialog).getByRole("button", { name: "식비" })).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByRole("button", { name: /간식/ })).toBeDisabled();
  });

  it("수정하면 수정 액션을 항목 uuid 로 부른다", async () => {
    const user = userEvent.setup();
    jest.mocked(updateBudgetItemAction).mockResolvedValue({ success: true, data: items[0] });
    render(<BudgetItemsSection items={items} expenseCategories={categories} failed={false} />);

    await user.click(screen.getByRole("button", { name: "남편 용돈 수정" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(updateBudgetItemAction).toHaveBeenCalledWith(items[0].uuid, {
        name: "남편 용돈",
        monthlyLimit: 400000,
        categoryUuids: [uuid(1)],
      })
    );
  });

  it("저장이 실패하면 토스트로 문구를 보이고 대화상자를 연 채 둔다", async () => {
    const user = userEvent.setup();
    jest.mocked(createBudgetItemAction).mockResolvedValue({
      success: false,
      error: { code: "C001", message: "이미 존재하는 예산 항목입니다" },
    });
    render(<BudgetItemsSection items={items} expenseCategories={categories} failed={false} />);

    await user.click(screen.getByRole("button", { name: "항목 추가" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("이름"), "여행");
    await user.click(within(dialog).getByRole("button", { name: "택시" }));
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("이미 존재하는 예산 항목입니다")
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("이름이 비었거나 카테고리를 고르지 않으면 저장 버튼이 비활성이다", async () => {
    const user = userEvent.setup();
    render(<BudgetItemsSection items={[]} expenseCategories={categories} failed={false} />);

    await user.click(screen.getAllByRole("button", { name: "항목 추가" })[0]);
    const dialog = screen.getByRole("dialog");
    const save = within(dialog).getByRole("button", { name: "저장" });
    expect(save).toBeDisabled();
    await user.type(within(dialog).getByLabelText("이름"), "여행");
    expect(save).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "택시" }));
    expect(save).toBeEnabled();
  });

  it("삭제는 확인을 누르면 그 uuid 로 삭제 액션을 부른다", async () => {
    const user = userEvent.setup();
    jest.mocked(deleteBudgetItemAction).mockResolvedValue({ success: true, data: undefined });
    render(<BudgetItemsSection items={items} expenseCategories={categories} failed={false} />);

    await user.click(screen.getByRole("button", { name: "남편 용돈 삭제" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent("'남편 용돈' 항목을 삭제할까요? 이 항목의 지출은 다시 생활비에 들어갑니다");
    await user.click(within(confirm).getByRole("button", { name: "삭제" }));

    await waitFor(() => expect(deleteBudgetItemAction).toHaveBeenCalledWith(items[0].uuid));
  });

  it("항목이 없으면 안내 문구를 보인다", () => {
    render(<BudgetItemsSection items={[]} expenseCategories={categories} failed={false} />);

    expect(
      screen.getByText("용돈처럼 따로 관리할 지출을 예산 항목으로 만들어 보세요")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "항목 추가" })).toBeEnabled();
  });

  it("항목이 10개면 항목 추가가 비활성이고 안내를 보인다", () => {
    const many = Array.from({ length: 10 }, (_, i) => item(i + 1, `항목${i + 1}`, 1000, []));
    render(<BudgetItemsSection items={many} expenseCategories={categories} failed={false} />);

    expect(screen.getByRole("button", { name: "항목 추가" })).toBeDisabled();
    expect(screen.getByText("예산 항목은 10개까지 만들 수 있어요")).toBeInTheDocument();
  });

  it("불러오기에 실패하면 구역 안에 실패 문구를 보인다", () => {
    render(<BudgetItemsSection items={[]} expenseCategories={[]} failed />);

    expect(screen.getByText("예산 항목을 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "항목 추가" })).not.toBeInTheDocument();
  });
});
