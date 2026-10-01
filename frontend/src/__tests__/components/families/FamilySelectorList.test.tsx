jest.mock("@/actions/family/select-family-action", () => ({
  selectFamilyAction: jest.fn(),
}));

const mockRefreshSession = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/client/use-session-refresh", () => ({
  useSessionRefresh: () => ({ refreshSession: mockRefreshSession }),
}));
jest.mock("@/lib/client/navigation", () => ({ useAppRouter: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

import { selectFamilyAction } from "@/actions/family/select-family-action";
import { FamilySelectorList } from "@/components/families/FamilySelectorList";
import { useAppRouter } from "@/lib/client/navigation";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const family = {
  uuid: "family-1",
  name: "우리 가족",
  monthlyBudget: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  memberCount: 2,
  expenseCount: 0,
  categoryCount: 0,
  categories: [],
};

describe("FamilySelectorList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshSession.mockResolvedValue(undefined);
  });

  it("가족 전환 action부터 refresh 완료까지 선택 버튼을 비활성화하고 진행 표시를 유지한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);

    let resolveAction!: (result: { success: true; data: undefined }) => void;
    jest.mocked(selectFamilyAction).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    const view = render(
      <FamilySelectorList families={[family]} selectedFamilyUuid="" />,
    );

    await userEvent.setup().click(
      screen.getByRole("button", { name: "우리 가족" }),
    );

    expect(screen.getByRole("button", { name: "전환 중..." })).toBeDisabled();

    router.isPending = true;
    view.rerender(
      <FamilySelectorList families={[family]} selectedFamilyUuid="" />,
    );

    await act(async () => {
      resolveAction({ success: true, data: undefined });
    });

    expect(selectFamilyAction).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "전환 중..." })).toBeDisabled();

    router.isPending = false;
    view.rerender(
      <FamilySelectorList families={[family]} selectedFamilyUuid="" />,
    );

    expect(screen.getByRole("button", { name: "우리 가족" })).toBeEnabled();
  });

  it("누른 가족에만 진행 표시를 하고 다른 가족은 이름을 유지한 채 비활성화한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    let resolveAction!: (result: Awaited<ReturnType<typeof selectFamilyAction>>) => void;
    jest.mocked(selectFamilyAction).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const other = { ...family, uuid: "family-2", name: "본가" };

    render(<FamilySelectorList families={[family, other]} selectedFamilyUuid="" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "우리 가족" }));

    expect(screen.getByRole("button", { name: "전환 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "본가" })).toBeDisabled();

    // 남은 비동기 전환이 다음 테스트로 이어지지 않게 끝낸다.
    await act(async () => {
      resolveAction({ success: false, error: { code: "F001", message: "전환 실패" } } as Awaited<ReturnType<typeof selectFamilyAction>>);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "우리 가족" })).toBeEnabled();
    });
  });

  it("전환 action이 실패하면 버튼을 다시 활성화하고 오류를 표시한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    jest.mocked(selectFamilyAction).mockResolvedValue({
      success: false,
      error: { code: "F001", message: "전환 실패" },
    });
    render(<FamilySelectorList families={[family]} selectedFamilyUuid="" />);

    await userEvent.setup().click(
      screen.getByRole("button", { name: "우리 가족" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "우리 가족" })).toBeEnabled();
    });
    expect(toast.error).toHaveBeenCalledWith("가족 전환에 실패했습니다.");
  });

  it("전환 action이 예외를 던지면 버튼을 다시 활성화하고 오류를 표시한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    jest.mocked(selectFamilyAction).mockRejectedValue(new Error("network"));
    render(<FamilySelectorList families={[family]} selectedFamilyUuid="" />);

    await userEvent.setup().click(
      screen.getByRole("button", { name: "우리 가족" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "우리 가족" })).toBeEnabled();
    });
    expect(toast.error).toHaveBeenCalledWith("가족 전환에 실패했습니다.");
  });
});

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
