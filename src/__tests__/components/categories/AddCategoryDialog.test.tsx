import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCategoryDialog } from "@/app/(authenticated)/categories/_components/AddCategoryDialog";
import { createCategoryAction } from "@/app/actions/category/create-category-action";

// Mock server action
jest.mock("@/app/actions/category/create-category-action", () => ({
  createCategoryAction: jest.fn(),
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("AddCategoryDialog", () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSuccess = jest.fn();
  const familyUuid = "test-family-uuid";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(
      <AddCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        familyUuid={familyUuid}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("카테고리 추가")).toBeInTheDocument();
    expect(screen.getByLabelText(/카테고리 이름/)).toBeInTheDocument();
    expect(screen.getByLabelText("예산 합계에서 제외")).toBeInTheDocument();
  });

  it("submits the form with excludeFromBudget unchecked by default", async () => {
    (createCategoryAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { uuid: "new-cat", name: "Test Cat" },
    });

    render(
      <AddCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        familyUuid={familyUuid}
        onSuccess={mockOnSuccess}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/카테고리 이름/), "Test Category");
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => {
      expect(createCategoryAction).toHaveBeenCalledWith(
        familyUuid,
        expect.objectContaining({
          name: "Test Category",
          excludeFromBudget: false,
        })
      );
    });
  });

  it("submits the form with excludeFromBudget checked", async () => {
    (createCategoryAction as jest.Mock).mockResolvedValue({
      success: true,
      data: { uuid: "new-cat", name: "Test Cat" },
    });

    render(
      <AddCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        familyUuid={familyUuid}
        onSuccess={mockOnSuccess}
      />
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/카테고리 이름/), "Excluded Category");
    await user.click(screen.getByLabelText("예산 합계에서 제외"));
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => {
      expect(createCategoryAction).toHaveBeenCalledWith(
        familyUuid,
        expect.objectContaining({
          name: "Excluded Category",
          excludeFromBudget: true,
        })
      );
    });
  });
});
