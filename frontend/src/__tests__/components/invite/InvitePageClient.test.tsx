/**
 * InvitePageClient 컴포넌트 테스트
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));
jest.mock("@/actions/invitation/accept-invitation-action", () => ({
  acceptInvitationAction: jest.fn(),
}));
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { InvitePageClient } from "@/app/(authenticated)/invite/[token]/_components/InvitePageClient";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/actions/invitation/accept-invitation-action";

const baseProps = {
  token: "token-1",
  familyName: "우리 가족",
  expiresAt: new Date("2030-01-01T00:00:00Z"),
};

describe("InvitePageClient", () => {
  it("초대를 수락하면 달력으로 이동한다", async () => {
    const push = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push, refresh: jest.fn() } as unknown as ReturnType<typeof useRouter>);
    jest.mocked(acceptInvitationAction).mockResolvedValue({ success: true, data: undefined });
    render(<InvitePageClient {...baseProps} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "초대 수락하기" }));

    expect(push).toHaveBeenCalledWith("/calendar");
  });
  it("초대자와 멤버 수가 있으면 초대자 이름, 멤버 수, 아바타 첫 글자를 보인다", () => {
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
    render(<InvitePageClient {...baseProps} />);

    expect(
      screen.getByText("가계부를 함께 관리하도록 초대받았어요"),
    ).toBeInTheDocument();
    expect(screen.queryByText("멤버")).not.toBeInTheDocument();
  });

  it("멤버 수가 0 이어도 멤버 줄을 보인다", () => {
    render(<InvitePageClient {...baseProps} memberCount={0} />);

    expect(screen.getByText("현재 0명")).toBeInTheDocument();
  });
});
