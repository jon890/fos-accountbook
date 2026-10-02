import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryItem } from "@/app/(authenticated)/categories/_components/CategoryItem";
import type { CategoryResponse } from "@/types/category";

const category: CategoryResponse = {
  uuid: "category-1",
  familyUuid: "family-1",
  type: "EXPENSE",
  name: "식비",
  color: "#ff0000",
  icon: "🍚",
  excludeFromBudget: false,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("CategoryItem", () => {
  it("카드를 누르면 수정 창을 연다", async () => {
    const onEdit = jest.fn();
    render(<CategoryItem category={category} onEdit={onEdit} onDelete={jest.fn()} />);

    await userEvent.setup().click(screen.getByText("식비"));

    expect(onEdit).toHaveBeenCalledWith(category);
  });

  it("삭제 버튼을 누르면 삭제 동작만 호출한다", async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<CategoryItem category={category} onEdit={onEdit} onDelete={onDelete} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "식비 삭제" }));

    expect(onDelete).toHaveBeenCalledWith(category);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("수정 버튼을 누르면 카드 클릭이 전파되지 않는다", async () => {
    const onEdit = jest.fn();
    render(<CategoryItem category={category} onEdit={onEdit} onDelete={jest.fn()} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "식비 수정" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(category);
  });
});
