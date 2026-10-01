jest.mock("@/actions/family/get-families-action", () => ({
  getFamiliesAction: jest.fn(),
}));
jest.mock("@/actions/user/get-user-profile-action", () => ({
  getUserProfileAction: jest.fn(),
}));
jest.mock("@/actions/user/set-default-family-action", () => ({
  setDefaultFamilyAction: jest.fn(),
}));

const mockRefreshSession = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/client/use-session-refresh", () => ({
  useSessionRefresh: () => ({ refreshSession: mockRefreshSession }),
}));
jest.mock("@/lib/client/navigation", () => ({ useAppRouter: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

import { getFamiliesAction } from "@/actions/family/get-families-action";
import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
import { getUserProfileAction } from "@/actions/user/get-user-profile-action";
import { FamilySelectorPage } from "@/components/families/FamilySelectorPage";
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
  memberCount: 1,
  expenseCount: 0,
  categoryCount: 0,
};

describe("FamilySelectorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshSession.mockResolvedValue(undefined);
    jest.mocked(getFamiliesAction).mockResolvedValue({
      success: true,
      data: [family],
    });
    jest.mocked(getUserProfileAction).mockResolvedValue({
      success: true,
      data: {
        timezone: "Asia/Seoul",
        language: "ko",
        currency: "KRW",
        defaultFamilyUuid: "",
      },
    });
  });

  it("자동 선택은 action과 session 갱신을 한 번씩 실행하고 navigation 완료까지 진행 표시를 유지한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);

    let resolveAction!: (value: { success: true; data: undefined }) => void;
    jest.mocked(setDefaultFamilyAction).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    const view = render(<FamilySelectorPage />);

    await waitFor(() => {
      expect(setDefaultFamilyAction).toHaveBeenCalledWith(family.uuid);
    });
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("이동 중...");

    router.isPending = true;
    view.rerender(<FamilySelectorPage />);

    await act(async () => {
      resolveAction({ success: true, data: undefined });
    });

    expect(setDefaultFamilyAction).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith("/calendar");
    expect(screen.getByRole("status")).toHaveTextContent("이동 중...");
    expect(screen.getByRole("button", { name: "이동 중..." })).toBeDisabled();
    expect(screen.getByText("우리 가족").closest("[aria-disabled]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    router.isPending = false;
    view.rerender(<FamilySelectorPage />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새 가족 만들기" })).toBeEnabled();
    expect(screen.getByText("우리 가족").closest("[aria-disabled]")).toHaveAttribute(
      "aria-disabled",
      "false",
    );
  });

  it("가족 선택 action이 실패하면 진행 상태를 해제하고 오류를 표시한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);
    jest.mocked(setDefaultFamilyAction).mockResolvedValue({
      success: false,
      error: { code: "F001", message: "선택 실패" },
    });

    render(<FamilySelectorPage />);

    await waitFor(() => {
      expect(setDefaultFamilyAction).toHaveBeenCalledWith(family.uuid);
    });

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith("가족 선택에 실패했습니다.");
    expect(mockRefreshSession).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("가족 선택 action이 예외를 던지면 진행 상태를 해제하고 오류를 표시한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);
    jest.mocked(getFamiliesAction).mockResolvedValue({
      success: true,
      data: [family, { ...family, uuid: "family-2", name: "다른 가족" }],
    });
    jest.mocked(setDefaultFamilyAction).mockRejectedValue(new Error("network"));

    render(<FamilySelectorPage />);

    await userEvent.setup().click(await screen.findByText("우리 가족"));

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith("가족 선택에 실패했습니다.");
    expect(mockRefreshSession).not.toHaveBeenCalled();
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
