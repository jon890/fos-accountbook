jest.mock("@/actions/family/create-family-action", () => ({
  createFamilyAction: jest.fn(),
}));

const mockRefreshSession = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/client/use-session-refresh", () => ({
  useSessionRefresh: () => ({ refreshSession: mockRefreshSession }),
}));
jest.mock("@/lib/client/navigation", () => ({ useAppRouter: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { createFamilyAction } from "@/actions/family/create-family-action";
import CreateFamilyPage from "@/app/(authenticated)/families/create/page";
import { useAppRouter } from "@/lib/client/navigation";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

describe("CreateFamilyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefreshSession.mockResolvedValue(undefined);
  });

  it("가족 생성 action부터 navigation 완료까지 제출 버튼을 비활성화하고 진행 표시를 유지한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);

    let resolveAction!: (
      value: Awaited<ReturnType<typeof createFamilyAction>>,
    ) => void;
    jest.mocked(createFamilyAction).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    const view = render(<CreateFamilyPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("가족 이름"), "우리 가족");
    await user.click(screen.getByRole("button", { name: "가족 만들기" }));

    expect(screen.getByRole("button", { name: "생성 중..." })).toBeDisabled();

    router.isPending = true;
    view.rerender(<CreateFamilyPage />);

    await act(async () => {
      resolveAction({
        success: true,
        data: { uuid: "family-1", name: "우리 가족" },
      });
    });

    expect(createFamilyAction).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith("/calendar");
    expect(screen.getByRole("button", { name: "생성 중..." })).toBeDisabled();
    expect(screen.getByLabelText("가족 이름")).toBeDisabled();

    router.isPending = false;
    view.rerender(<CreateFamilyPage />);

    expect(screen.getByRole("button", { name: "가족 만들기" })).toBeEnabled();
    expect(screen.getByLabelText("가족 이름")).toBeEnabled();
  });

  it("생성 action 실패 후 제출 버튼을 다시 활성화한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    jest.mocked(createFamilyAction).mockResolvedValue({
      success: false,
      error: { code: "F001", message: "생성 실패" },
    });
    render(<CreateFamilyPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("가족 이름"), "우리 가족");
    await user.click(screen.getByRole("button", { name: "가족 만들기" }));

    expect(await screen.findByRole("button", { name: "가족 만들기" })).toBeEnabled();
    expect(toast.error).toHaveBeenCalledWith("생성 실패");
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
