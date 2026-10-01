import { act, render, screen, waitFor } from "@testing-library/react";
import { InviteFamilyDialog } from "@/components/families/InviteFamilyDialog";
import { getActiveInvitationsAction } from "@/actions/invitation/get-active-invitations-action";
import { createInvitationLinkAction } from "@/actions/invitation/create-invitation-link-action";
import { deleteInvitationAction } from "@/actions/invitation/delete-invitation-action";
import { toast } from "sonner";
import type { InvitationInfo } from "@/types/invitation";
import type { ActionResult } from "@/lib/errors";
import userEvent from "@testing-library/user-event";

jest.mock("@/actions/invitation/get-active-invitations-action", () => ({ getActiveInvitationsAction: jest.fn() }));
jest.mock("@/actions/invitation/create-invitation-link-action", () => ({ createInvitationLinkAction: jest.fn() }));
jest.mock("@/actions/invitation/delete-invitation-action", () => ({ deleteInvitationAction: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const invitation: InvitationInfo = {
  uuid: "invitation-1",
  token: "token-1",
  expiresAt: new Date("2026-10-04T00:00:00Z"),
  createdAt: new Date("2026-10-01T00:00:00Z"),
  isExpired: false,
  isUsed: false,
  inviteUrl: "https://example.com/invite/token-1",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getActiveInvitationsAction).mockResolvedValue({ success: true, data: [invitation] });
});

it("외부 open이 처음부터 true이면 기존 초대를 표시한다", async () => {
  render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  expect(await screen.findByText(invitation.inviteUrl)).toBeInTheDocument();
  expect(screen.getByText(/72시간 유효/)).toBeInTheDocument();
});

it("외부에서 다시 열면 초대 목록을 갱신한다", async () => {
  const { rerender } = render(<InviteFamilyDialog open={false} onOpenChange={jest.fn()} />);
  expect(getActiveInvitationsAction).not.toHaveBeenCalled();
  rerender(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  expect(await screen.findByText(invitation.inviteUrl)).toBeInTheDocument();
  rerender(<InviteFamilyDialog open={false} onOpenChange={jest.fn()} />);
  jest.mocked(getActiveInvitationsAction).mockResolvedValue({ success: true, data: [{ ...invitation, inviteUrl: "https://example.com/invite/new" }] });
  rerender(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  expect(await screen.findByText("https://example.com/invite/new")).toBeInTheDocument();
  expect(screen.queryByText(invitation.inviteUrl)).not.toBeInTheDocument();
});

it("빈 활성 목록에서는 링크 목록을 표시하지 않는다", async () => {
  jest.mocked(getActiveInvitationsAction).mockResolvedValue({ success: true, data: [] });
  render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  await waitFor(() => expect(getActiveInvitationsAction).toHaveBeenCalled());
  expect(screen.queryByText("활성 초대 링크")).not.toBeInTheDocument();
});

it.each([false, true])("조회 실패는 알리고 다음 열기에서 재시도한다 (예외: %s)", async (throws) => {
  if (throws) {
    jest.mocked(getActiveInvitationsAction).mockRejectedValueOnce(new Error("연결 실패"));
  } else {
    jest.mocked(getActiveInvitationsAction).mockResolvedValueOnce({ success: false, error: { code: "C001", message: "목록 실패" } });
  }
  const { rerender } = render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith(throws ? "초대 목록을 불러오지 못했습니다" : "목록 실패"));
  rerender(<InviteFamilyDialog open={false} onOpenChange={jest.fn()} />);
  rerender(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  expect(await screen.findByText(invitation.inviteUrl)).toBeInTheDocument();
});

it("닫기 전에 시작한 조회가 늦게 끝나도 다시 연 목록을 덮어쓰지 않는다", async () => {
  let finish: ((result: ActionResult<InvitationInfo[]>) => void) | undefined;
  jest.mocked(getActiveInvitationsAction).mockReturnValueOnce(new Promise((resolve) => {
    finish = resolve;
  }));
  const { rerender } = render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  rerender(<InviteFamilyDialog open={false} onOpenChange={jest.fn()} />);
  rerender(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  expect(await screen.findByText(invitation.inviteUrl)).toBeInTheDocument();
  await act(async () => {
    finish?.({ success: true, data: [{ ...invitation, inviteUrl: "https://example.com/invite/stale" }] });
  });
  expect(screen.queryByText("https://example.com/invite/stale")).not.toBeInTheDocument();
  expect(screen.getByText(invitation.inviteUrl)).toBeInTheDocument();
});

it("초대를 만든 뒤 목록을 갱신하고 링크를 복사한다", async () => {
  const user = userEvent.setup();
  jest.mocked(createInvitationLinkAction).mockResolvedValue({ success: true, data: invitation });
  const clipboard = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  await screen.findByText(invitation.inviteUrl);
  await user.click(screen.getByRole("button", { name: "새 초대 링크 생성" }));
  expect(toast.success).toHaveBeenCalledWith("초대 링크가 생성되었습니다");
  expect(clipboard).toHaveBeenCalledWith(invitation.inviteUrl);
  clipboard.mockRestore();
});

it("초대 삭제 실패를 알리고 기존 목록을 유지한다", async () => {
  jest.mocked(deleteInvitationAction).mockResolvedValue({ success: false, error: { code: "C001", message: "삭제 실패" } });
  render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  await screen.findByText(invitation.inviteUrl);
  await userEvent.setup().click(screen.getByRole("button", { name: "초대 링크 삭제" }));
  expect(toast.error).toHaveBeenCalledWith("삭제 실패");
  expect(screen.getByText(invitation.inviteUrl)).toBeInTheDocument();
});

it("초대를 삭제한 뒤 갱신된 빈 목록을 표시한다", async () => {
  jest.mocked(deleteInvitationAction).mockResolvedValue({ success: true, data: undefined });
  render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  await screen.findByText(invitation.inviteUrl);
  jest.mocked(getActiveInvitationsAction).mockResolvedValue({ success: true, data: [] });
  await userEvent.setup().click(screen.getByRole("button", { name: "초대 링크 삭제" }));
  await waitFor(() => expect(screen.queryByText(invitation.inviteUrl)).not.toBeInTheDocument());
  expect(toast.success).toHaveBeenCalledWith("초대가 삭제되었습니다");
});

it("초대 생성 실패를 알리고 생성 버튼을 다시 사용할 수 있다", async () => {
  jest.mocked(createInvitationLinkAction).mockRejectedValue(new Error("연결 실패"));
  render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  await screen.findByText(invitation.inviteUrl);
  await userEvent.setup().click(screen.getByRole("button", { name: "새 초대 링크 생성" }));
  expect(toast.error).toHaveBeenCalledWith("초대 링크 생성에 실패했습니다");
  expect(screen.getByRole("button", { name: "새 초대 링크 생성" })).toBeEnabled();
});

it("화면을 제거한 뒤 조회 실패가 도착해도 토스트를 표시하지 않는다", async () => {
  let reject: ((reason: Error) => void) | undefined;
  jest.mocked(getActiveInvitationsAction).mockReturnValueOnce(new Promise((_, rejectPromise) => {
    reject = rejectPromise;
  }));
  const { unmount } = render(<InviteFamilyDialog open onOpenChange={jest.fn()} />);
  unmount();
  await act(async () => {
    reject?.(new Error("연결 실패"));
  });
  expect(toast.error).not.toHaveBeenCalled();
});
