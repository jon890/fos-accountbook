import { render, screen, within } from "@testing-library/react";
import { CategoryList } from "@/app/(authenticated)/categories/_components/CategoryList";
import { CategoryResponse } from "@/types/category";

jest.mock("@/app/actions/category/delete-category-action", () => ({
  deleteCategoryAction: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const categories: CategoryResponse[] = [
  {
    uuid: "cat-1",
    familyUuid: "fam-1",
    name: "Regular Category",
    color: "#000000",
    icon: "🍔",
    excludeFromBudget: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    uuid: "cat-2",
    familyUuid: "fam-1",
    name: "Excluded Category",
    color: "#ffffff",
    icon: "🚫",
    excludeFromBudget: true,
    createdAt: "",
    updatedAt: "",
  },
];

describe("CategoryList", () => {
  it("displays badge for categories excluded from budget", () => {
    render(
      <CategoryList
        categories={categories}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    // Find the card for Excluded Category
    // We can find the heading first, then check its parent/container for the badge
    const excludedCategoryHeading = screen.getByRole("heading", { name: "Excluded Category" });
    const excludedCardContent = excludedCategoryHeading.closest("div");
    
    // Check if badge is within the same container
    expect(within(excludedCardContent!).getByText("예산 제외")).toBeInTheDocument();

    // Find the card for Regular Category
    const regularCategoryHeading = screen.getByRole("heading", { name: "Regular Category" });
    const regularCardContent = regularCategoryHeading.closest("div");

    // Check that badge is NOT within this container
    expect(within(regularCardContent!).queryByText("예산 제외")).not.toBeInTheDocument();
  });
});
