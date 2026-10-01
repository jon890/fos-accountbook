import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddCategoryDialog } from "@/app/(authenticated)/categories/_components/AddCategoryDialog";
import { createCategoryAction } from "@/actions/category/create-category-action";
import { useMediaQuery } from "@/hooks/useMediaQuery";

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(),
}));

// Mock server action
jest.mock("@/actions/category/create-category-action", () => ({
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
    jest.mocked(useMediaQuery).mockReturnValue(true);
  });

  it.each([
    [false, "sheet-content"],
    [true, "dialog-content"],
  ])("폭에 따라 %s에서 %s를 표시한다", (isDesktop, slot) => {
    jest.mocked(useMediaQuery).mockReturnValue(isDesktop);

    const { container } = render(
      <AddCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        familyUuid={familyUuid}
        type="EXPENSE"
        onSuccess={mockOnSuccess}
      />,
    );

    expect(container.ownerDocument.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    expect(screen.queryByText("oklch(0.560 0.140 35)")).not.toBeInTheDocument();
  });

  it("renders correctly", () => {
    render(
      <AddCategoryDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        familyUuid={familyUuid}
        type="EXPENSE"
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
        type="EXPENSE"
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
        type="EXPENSE"
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
