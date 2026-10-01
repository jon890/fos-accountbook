/**
 * InvitePageClient 컴포넌트 테스트
 * @jest-environment jsdom
 */

jest.mock("@/lib/client/navigation", () => ({ useAppRouter: jest.fn() }));
jest.mock("@/actions/invitation/accept-invitation-action", () => ({
  acceptInvitationAction: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { acceptInvitationAction } from "@/actions/invitation/accept-invitation-action";
import { InvitePageClient } from "@/app/(authenticated)/invite/[token]/_components/InvitePageClient";
import { useAppRouter } from "@/lib/client/navigation";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const baseProps = {
  token: "token-1",
  familyName: "우리 가족",
  expiresAt: new Date("2030-01-01T00:00:00Z"),
};

describe("InvitePageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("초대 수락 action부터 navigation 완료까지 양쪽 버튼을 비활성화하고 진행 표시를 유지한다", async () => {
    const router = createRouter();
    jest.mocked(useAppRouter).mockReturnValue(router);

    let resolveAction!: (
      value: Awaited<ReturnType<typeof acceptInvitationAction>>,
    ) => void;
    jest.mocked(acceptInvitationAction).mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );

    const view = render(<InvitePageClient {...baseProps} />);

    await userEvent.setup().click(
      screen.getByRole("button", { name: "초대 수락하기" }),
    );

    expect(screen.getByRole("button", { name: "수락 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "거절하기" })).toBeDisabled();

    router.isPending = true;
    view.rerender(<InvitePageClient {...baseProps} />);

    await act(async () => {
      resolveAction({ success: true, data: undefined });
    });

    expect(acceptInvitationAction).toHaveBeenCalledWith(baseProps.token);
    expect(acceptInvitationAction).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith("/calendar");
    expect(screen.getByRole("button", { name: "수락 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "거절하기" })).toBeDisabled();

    router.isPending = false;
    view.rerender(<InvitePageClient {...baseProps} />);

    expect(screen.getByRole("button", { name: "초대 수락하기" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "거절하기" })).toBeEnabled();
  });

  it("수락 action이 예외를 던지면 버튼을 다시 활성화하고 오류를 표시한다", async () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    jest.mocked(acceptInvitationAction).mockRejectedValue(new Error("실패"));
    render(<InvitePageClient {...baseProps} />);

    await userEvent.setup().click(
      screen.getByRole("button", { name: "초대 수락하기" }),
    );

    expect(
      await screen.findByRole("button", { name: "초대 수락하기" }),
    ).toBeEnabled();
    expect(toast.error).toHaveBeenCalledWith("초대 수락 중 오류가 발생했습니다");
  });

  it("초대자와 멤버 수가 있으면 초대자 이름, 멤버 수, 아바타 첫 글자를 보인다", () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    render(
      <InvitePageClient {...baseProps} inviterName="홍길동" memberCount={2} />,
    );

    expect(
      screen.getByText("홍길동님이 가계부를 함께 관리하자고 초대했어요"),
    ).toBeInTheDocument();
    expect(screen.getByText("현재 2명")).toBeInTheDocument();
    expect(screen.getByText("홍")).toBeInTheDocument();
  });

  it("두 값이 없으면 기존 문구를 보이고 멤버 줄을 숨긴다", () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    render(<InvitePageClient {...baseProps} />);

    expect(
      screen.getByText("가계부를 함께 관리하도록 초대받았어요"),
    ).toBeInTheDocument();
    expect(screen.queryByText("멤버")).not.toBeInTheDocument();
  });

  it("멤버 수가 0 이어도 멤버 줄을 보인다", () => {
    jest.mocked(useAppRouter).mockReturnValue(createRouter());
    render(<InvitePageClient {...baseProps} memberCount={0} />);

    expect(screen.getByText("현재 0명")).toBeInTheDocument();
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
