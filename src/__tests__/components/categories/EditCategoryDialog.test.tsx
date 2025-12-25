import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditCategoryDialog } from "@/app/(authenticated)/categories/_components/EditCategoryDialog";
import { updateCategoryAction } from "@/app/actions/category/update-category-action";

// Mock server action
jest.mock("@/app/actions/category/update-category-action", () => ({
  updateCategoryAction: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockCategory = {
  uuid: "cat-1",
  familyUuid: "fam-1",
  name: "Original Name",
  color: "#000000",
  icon: "🍔",
  excludeFromBudget: true, // Initially excluded
  createdAt: "2023-01-01",
  updatedAt: "2023-01-01",
};

describe("EditCategoryDialog", () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes form with category data including excludeFromBudget", () => {
    render(
      <EditCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        category={mockCategory}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByDisplayValue("Original Name")).toBeInTheDocument();
    expect(screen.getByLabelText("예산 합계에서 제외")).toBeChecked();
  });

  it("updates excludeFromBudget when checkbox is toggled", async () => {
    (updateCategoryAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockCategory, excludeFromBudget: false },
    });

    render(
      <EditCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        category={mockCategory}
        onSuccess={mockOnSuccess}
      />
    );

    const user = userEvent.setup();

    // Uncheck
    await user.click(screen.getByLabelText("예산 합계에서 제외"));
    await user.click(screen.getByRole("button", { name: "수정" }));

    await waitFor(() => {
      expect(updateCategoryAction).toHaveBeenCalledWith(
        mockCategory.uuid,
        expect.objectContaining({
          excludeFromBudget: false,
        })
      );
    });
  });
});
