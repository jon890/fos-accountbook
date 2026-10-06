import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationList } from "@/components/notifications/NotificationList";
import { getNotificationsAction } from "@/actions/notification/get-notifications-action";
import type { Notification } from "@/types/actions/notification";

jest.mock("@/actions/notification/get-notifications-action", () => ({
  getNotificationsAction: jest.fn(),
}));
jest.mock("@/actions/notification/mark-all-notifications-read-action", () => ({
  markAllNotificationsReadAction: jest.fn(),
}));
jest.mock("@/components/notifications/NotificationItem", () => ({
  NotificationItem: ({ onNavigate }: { onNavigate?: () => void }) => (
    <button type="button" onClick={onNavigate}>
      예산 알림
    </button>
  ),
}));

const mockGetNotificationsAction = jest.mocked(getNotificationsAction);
const notification: Notification = {
  notificationUuid: "notification-1",
  familyUuid: "family-1",
  userUuid: "user-1",
  type: "BUDGET_50_EXCEEDED",
  typeDisplayName: "예산 알림",
  title: "예산 사용량 알림",
  message: "예산의 50%를 사용했습니다.",
  referenceUuid: "budget-1",
  referenceType: "BUDGET",
  yearMonth: "2026-10",
  isRead: false,
  createdAt: "2026-10-01T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetNotificationsAction.mockResolvedValue({
    success: true,
    data: { notifications: [notification], unreadCount: 1, totalCount: 1 },
  });
});

describe("NotificationList", () => {
  it("알림 이동 콜백이 헤더 알림 창 닫기 콜백을 호출한다", async () => {
    const onLinkClick = jest.fn();
    render(<NotificationList familyUuid="family-1" onLinkClick={onLinkClick} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "예산 알림" })).toBeInTheDocument());
    await userEvent.setup().click(screen.getByRole("button", { name: "예산 알림" }));

    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });
});
