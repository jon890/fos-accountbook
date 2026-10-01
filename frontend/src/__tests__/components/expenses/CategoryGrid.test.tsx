import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryGrid } from "@/components/expenses/forms/CategoryGrid";
import type { CategoryResponse } from "@/types/category";

jest.mock("@/hooks/useMediaQuery", () => ({ useMediaQuery: jest.fn() }));

import { useMediaQuery } from "@/hooks/useMediaQuery";

const mockedUseMediaQuery = jest.mocked(useMediaQuery);

function makeCategory(uuid: string, name: string, icon = "📦"): CategoryResponse {
  return {
    uuid,
    familyUuid: "fam-1",
    type: "EXPENSE",
    name,
    icon,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
  };
}

const sample10: CategoryResponse[] = [
  makeCategory("c1", "식비"),
  makeCategory("c2", "카페"),
  makeCategory("c3", "교통"),
  makeCategory("c4", "통신"),
  makeCategory("c5", "주거"),
  makeCategory("c6", "쇼핑"),
  makeCategory("c7", "의료"),
  makeCategory("c8", "여가"),
  makeCategory("c9", "교육"),
  makeCategory("c10", "기타"),
];

const sample15 = [
  ...sample10,
  makeCategory("c11", "간식"),
  makeCategory("c12", "여행"),
  makeCategory("c13", "구독"),
  makeCategory("c14", "선물"),
  makeCategory("c15", "반려동물"),
];

describe("CategoryGrid", () => {
  beforeEach(() => {
    mockedUseMediaQuery.mockReturnValue(false);
  });

  it("renders all categories", () => {
    render(<CategoryGrid categories={sample10} selectedUuid={null} onSelect={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(10);
    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.getByText("기타")).toBeInTheDocument();
  });

  it("uses responsive grid (grid-cols-5 + md:grid-cols-10)", () => {
    const { container } = render(
      <CategoryGrid categories={sample10} selectedUuid={null} onSelect={() => {}} />,
    );
    const grid = container.querySelector("[role=radiogroup]");
    expect(grid?.className).toMatch(/grid-cols-5/);
    expect(grid?.className).toMatch(/md:grid-cols-10/);
  });

  it("marks selected category with aria-checked and tone class", () => {
    render(<CategoryGrid categories={sample10} selectedUuid="c1" onSelect={() => {}} />);
    const selected = screen.getByRole("radio", { checked: true });
    expect(selected).toHaveTextContent("식비");
    expect(selected.className).toMatch(/bg-\[var\(--color-cat-food-bg\)\]/);
  });

  it("calls onSelect with uuid when clicked", () => {
    const handler = jest.fn();
    render(<CategoryGrid categories={sample10} selectedUuid={null} onSelect={handler} />);
    fireEvent.click(screen.getByText("교통"));
    expect(handler).toHaveBeenCalledWith("c3");
  });

  it("falls back to etc tone for unknown category name", () => {
    const custom = [makeCategory("cx", "기상천외 카테고리")];
    render(<CategoryGrid categories={custom} selectedUuid="cx" onSelect={() => {}} />);
    const selected = screen.getByRole("radio", { checked: true });
    expect(selected.className).toMatch(/bg-\[var\(--color-cat-etc-bg\)\]/);
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<CategoryGrid categories={sample10} selectedUuid={null} onSelect={() => {}} disabled />);
    screen.getAllByRole("radio").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("예산 제외 카테고리의 접근 이름에 예산 제외를 포함한다", () => {
    const excludedCategory = { ...makeCategory("excluded", "비상금"), excludeFromBudget: true };
    render(<CategoryGrid categories={[excludedCategory]} selectedUuid={null} onSelect={() => {}} />);
    expect(screen.getByRole("radio", { name: "비상금 예산 제외" })).toBeInTheDocument();
  });

  it("Tab 정지점은 하나이며 오른쪽 방향키로 다음 카테고리를 선택하고 포커스한다", () => {
    const onSelect = jest.fn();
    render(<CategoryGrid categories={sample10} selectedUuid="c1" onSelect={onSelect} />);

    const radios = screen.getAllByRole("radio");
    expect(radios.filter((radio) => radio.getAttribute("tabindex") === "0")).toHaveLength(1);

    const first = screen.getByRole("radio", { name: "식비" });
    const second = screen.getByRole("radio", { name: "카페" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });

    expect(onSelect).toHaveBeenCalledWith("c2");
    expect(second).toHaveFocus();
  });

  it.each([
    [false, "c6"],
    [true, "c11"],
  ])("아래 방향키는 %s 해상도에서 열 수만큼 이동한다", (isDesktop, expectedUuid) => {
    mockedUseMediaQuery.mockReturnValue(isDesktop);
    const onSelect = jest.fn();
    render(<CategoryGrid categories={sample15} selectedUuid="c1" onSelect={onSelect} />);

    fireEvent.keyDown(screen.getByRole("radio", { name: "식비" }), { key: "ArrowDown" });

    expect(onSelect).toHaveBeenCalledWith(expectedUuid);
    expect(screen.getByRole("radio", { name: sample15[Number(expectedUuid.slice(1)) - 1].name })).toHaveFocus();
  });

  it("카테고리 버튼의 최소 터치 크기와 예산 제외 아이콘의 직접 자식을 유지한다", () => {
    const excludedCategory = { ...makeCategory("excluded", "비상금"), excludeFromBudget: true };
    render(<CategoryGrid categories={[excludedCategory]} selectedUuid={null} onSelect={() => {}} />);

    const categoryButton = screen.getByRole("radio", { name: "비상금 예산 제외" });
    expect(categoryButton).toHaveClass("min-h-11", "min-w-11");
    expect(categoryButton.querySelector(":scope > svg")).toBeInTheDocument();
  });
});
