import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { markNotificationReadAction } from "@/actions/notification/mark-notification-read-action";
import { useAppRouter } from "@/lib/client/navigation";
import { toast } from "sonner";
import { ErrorCode } from "@/lib/errors";
import type { ActionResult } from "@/lib/errors";
import type { Notification } from "@/types/actions/notification";

jest.mock("@/actions/notification/mark-notification-read-action", () => ({
  markNotificationReadAction: jest.fn(),
}));
jest.mock("@/lib/client/navigation", () => ({ useAppRouter: jest.fn() }));
jest.mock("@/lib/client/timezone-context", () => ({
  useTimeZone: () => ({ timezone: "Asia/Seoul" }),
}));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

const mockPush = jest.fn();
const mockMarkNotificationReadAction = jest.mocked(markNotificationReadAction);
const mockUseAppRouter = jest.mocked(useAppRouter);

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  notificationUuid: "notification-1",
  familyUuid: "family-1",
  userUuid: "user-1",
  type: "BUDGET_80_EXCEEDED",
  typeDisplayName: "예산 알림",
  title: "예산 사용량 알림",
  message: "예산의 80%를 사용했습니다.",
  referenceUuid: "budget-1",
  referenceType: "BUDGET",
  yearMonth: "2026-10",
  isRead: false,
  createdAt: "2026-10-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAppRouter.mockReturnValue({
    isPending: false,
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    bfcacheId: "test-bfcache-id",
  } as ReturnType<typeof useAppRouter>);
  mockMarkNotificationReadAction.mockResolvedValue({
    success: true,
    data: createNotification({ isRead: true }),
  });
});

describe("NotificationItem", () => {
  it("안 읽은 예산 알림을 읽음 처리한 뒤 예산 화면으로 이동한다", async () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    render(
      <NotificationItem
        notification={createNotification()}
        onRead={onRead}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.setup().click(screen.getByRole("button"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/budget"));
    expect(mockMarkNotificationReadAction).toHaveBeenCalledWith("family-1", "notification-1");
    expect(onRead).toHaveBeenCalledWith("notification-1");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("다른 종류의 알림은 읽음 처리만 하고 이동하지 않는다", async () => {
    render(
      <NotificationItem
        notification={createNotification({ type: "RECURRING_EXPENSE_CREATED" })}
      />,
    );

    await userEvent.setup().click(screen.getByRole("button"));

    await waitFor(() => expect(mockMarkNotificationReadAction).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("읽음 처리에 실패하면 오류를 알리고 이동하지 않는다", async () => {
    mockMarkNotificationReadAction.mockResolvedValue({
      success: false,
      error: { code: ErrorCode.NOTIFICATION_READ_FAILED, message: "읽음 처리 실패" },
    });
    const onNavigate = jest.fn();
    render(<NotificationItem notification={createNotification()} onNavigate={onNavigate} />);

    await userEvent.setup().click(screen.getByRole("button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("알림 읽음 처리에 실패했어요. 다시 시도해 주세요."),
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("이미 읽은 예산 알림은 읽음 처리 없이 바로 예산 화면으로 이동한다", async () => {
    render(<NotificationItem notification={createNotification({ isRead: true })} />);

    await userEvent.setup().click(screen.getByRole("button"));

    expect(mockMarkNotificationReadAction).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/budget");
  });

  it("읽음 처리와 화면 이동 대기 중에는 다시 누를 수 없다", async () => {
    let resolveRead: ((result: ActionResult<Notification>) => void) | undefined;
    mockMarkNotificationReadAction.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    );
    render(<NotificationItem notification={createNotification()} />);

    const button = screen.getByRole("button");
    await userEvent.setup().click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");

    resolveRead?.({ success: true, data: createNotification({ isRead: true }) });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it("화면 이동 대기 중에는 버튼을 비활성화한다", () => {
    mockUseAppRouter.mockReturnValue({
      isPending: true,
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      bfcacheId: "test-bfcache-id",
    } as ReturnType<typeof useAppRouter>);
    render(<NotificationItem notification={createNotification({ isRead: true })} />);

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
});
