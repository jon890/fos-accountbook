import { fireEvent, render, screen } from "@testing-library/react";
import { CategoryGrid } from "@/components/expenses/forms/CategoryGrid";
import type { CategoryResponse } from "@/types/category";

function makeCategory(uuid: string, name: string, icon = "📦"): CategoryResponse {
  return {
    uuid,
    familyUuid: "fam-1",
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

describe("CategoryGrid", () => {
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
});
