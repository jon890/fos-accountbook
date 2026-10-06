jest.mock("@/actions/family/get-families-action", () => ({
  getFamiliesAction: jest.fn(),
}));
jest.mock("@/actions/family/get-selected-family-action", () => ({
  getSelectedFamilyAction: jest.fn(),
}));
jest.mock("@/actions/family/select-family-action", () => ({
  selectFamilyAction: jest.fn(),
}));

const mockRefreshSession = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/client/use-session-refresh", () => ({
  useSessionRefresh: () => ({ refreshSession: mockRefreshSession }),
}));
jest.mock("@/lib/client/navigation", () => ({ useAppRouter: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

import { getFamiliesAction } from "@/actions/family/get-families-action";
import { getSelectedFamilyAction } from "@/actions/family/get-selected-family-action";
import { selectFamilyAction } from "@/actions/family/select-family-action";
import { FamilySelectorDropdown } from "@/components/families/FamilySelectorDropdown";
import { useAppRouter } from "@/lib/client/navigation";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const families = [
  {
    uuid: "family-1",
    name: "우리 가족",
    monthlyBudget: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    memberCount: 2,
    expenseCount: 0,
    categoryCount: 0,
  },
  {
    uuid: "family-2",
    name: "다른 가족",
    monthlyBudget: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    memberCount: 1,
    expenseCount: 0,
    categoryCount: 0,
  },
];

describe("FamilySelectorDropdown", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: () => undefined,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshSession.mockResolvedValue(undefined);
    jest.mocked(getFamiliesAction).mockResolvedValue({
      success: true,
      data: families,
    });
    jest.mocked(getSelectedFamilyAction).mockResolvedValue({
      success: true,
      data: families[0].uuid,
    });
  });

  it("가족 전환 action부터 refresh 완료까지 Select를 비활성화하고 진행 표시를 유지한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);

    let resolveAction!: (result: Awaited<ReturnType<typeof selectFamilyAction>>) => void;
    jest.mocked(selectFamilyAction).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    const view = render(<FamilySelectorDropdown />);
    const user = userEvent.setup();

    await selectFamily(user, "다른 가족");

    expect(screen.getByRole("combobox", { name: "가족 전환 중" })).toBeDisabled();
    expect(screen.getByText("전환 중...")).toBeInTheDocument();

    router.isPending = true;
    view.rerender(<FamilySelectorDropdown />);

    await act(async () => {
      resolveAction({ success: true, data: undefined });
    });

    expect(selectFamilyAction).toHaveBeenCalledTimes(1);
    expect(selectFamilyAction).toHaveBeenCalledWith("family-2");
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("combobox", { name: "가족 전환 중" })).toBeDisabled();

    router.isPending = false;
    view.rerender(<FamilySelectorDropdown />);

    expect(screen.getByRole("combobox", { name: "가족 선택" })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: "가족 선택" })).toHaveTextContent(
      "다른 가족",
    );
  });

  it("전환 action이 실패하면 이전 선택을 복구하고 오류를 표시한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    jest.mocked(selectFamilyAction).mockResolvedValue({
      success: false,
      error: { code: "F001", message: "전환 실패" },
    });

    render(<FamilySelectorDropdown />);
    const user = userEvent.setup();

    await selectFamily(user, "다른 가족");

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "가족 선택" })).toBeEnabled();
    });
    expect(screen.getByRole("combobox", { name: "가족 선택" })).toHaveTextContent(
      "우리 가족",
    );
    expect(selectFamilyAction).toHaveBeenCalledWith("family-2");
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("가족 전환에 실패했습니다.");
  });

  it("전환 action이 예외를 던지면 이전 선택을 복구하고 오류를 표시한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    jest.mocked(selectFamilyAction).mockRejectedValue(new Error("network"));

    render(<FamilySelectorDropdown />);
    const user = userEvent.setup();

    await selectFamily(user, "다른 가족");

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "가족 선택" })).toBeEnabled();
    });
    expect(screen.getByRole("combobox", { name: "가족 선택" })).toHaveTextContent(
      "우리 가족",
    );
    expect(selectFamilyAction).toHaveBeenCalledWith("family-2");
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("가족 전환에 실패했습니다.");
  });
});

async function selectFamily(
  user: ReturnType<typeof userEvent.setup>,
  familyName: string,
) {
  await user.click(await screen.findByRole("combobox", { name: "가족 선택" }));
  await user.click(await screen.findByRole("option", { name: familyName }));
}

function createRouter(): ReturnType<typeof useAppRouter> {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    bfcacheId: "",
    isPending: false,
  };
}
