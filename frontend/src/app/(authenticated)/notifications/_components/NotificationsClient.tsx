"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { markAllNotificationsReadAction } from "@/actions/notification/mark-all-notifications-read-action";
import type { Notification } from "@/types/actions/notification";

interface NotificationsClientProps {
  familyUuid: string;
  notifications: Notification[];
  filter: "all" | "unread";
}

export function NotificationsClient({
  familyUuid,
  notifications,
  filter,
}: NotificationsClientProps) {
  const router = useRouter();
  const [localNotifications, setLocalNotifications] =
    useState<Notification[]>(notifications);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // client-side filter — 서버에서 모든 알림을 받아 메모리 필터
  const visible =
    filter === "unread"
      ? localNotifications.filter((n) => !n.isRead)
      : localNotifications;

  const unreadCount = localNotifications.filter((n) => !n.isRead).length;

  const handleFilterChange = (next: "all" | "unread") => {
    router.push(
      next === "all" ? "/notifications" : "/notifications?filter=unread"
    );
  };

  const handleNotificationRead = (notificationUuid: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) =>
        n.notificationUuid === notificationUuid ? { ...n, isRead: true } : n
      )
    );
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    const result = await markAllNotificationsReadAction(familyUuid);
    if (result.success) {
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } else {
      toast.error("알림 읽음 처리에 실패했어요. 다시 시도해 주세요.");
    }
    setMarkingAllRead(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-fg">알림</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            className="h-8 text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            모두 읽음
          </Button>
        )}
      </div>

      {/* Segmented 필터 */}
      <div
        role="tablist"
        className="flex rounded-[10px] bg-bg-muted p-1 mb-4"
      >
        {(["all", "unread"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            onClick={() => handleFilterChange(tab)}
            className={
              filter === tab
                ? "flex-1 py-1.5 text-sm font-semibold rounded-lg bg-bg-elev shadow-sm text-fg"
                : "flex-1 py-1.5 text-sm text-fg-muted"
            }
          >
            {tab === "all" ? "전체" : "안 읽음"}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-semibold text-fg">
            {filter === "unread" ? "안 읽은 알림이 없어요" : "알림이 없어요"}
          </p>
          <p className="text-xs text-fg-muted mt-1">
            예산 80% / 100% 초과 시 알려드릴게요
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {visible.map((notification) => (
            <NotificationItem
              key={notification.notificationUuid}
              notification={notification}
              onRead={handleNotificationRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
