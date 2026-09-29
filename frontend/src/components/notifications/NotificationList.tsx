"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Bell } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { getNotificationsAction } from "@/actions/notification/get-notifications-action";
import { markAllNotificationsReadAction } from "@/actions/notification/mark-all-notifications-read-action";
import type { Notification } from "@/types/actions/notification";

interface NotificationListProps {
  familyUuid: string;
  onNotificationRead?: () => void;
  onAllRead?: () => void;
  onLinkClick?: () => void;
}

export function NotificationList({
  familyUuid,
  onNotificationRead,
  onAllRead,
  onLinkClick,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!familyUuid) return;

    const fetchNotifications = async () => {
      setLoading(true);
      const result = await getNotificationsAction(familyUuid);
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [familyUuid]);

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    const result = await markAllNotificationsReadAction(familyUuid);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onAllRead?.();
    } else {
      toast.error("알림 읽음 처리에 실패했어요. 다시 시도해 주세요.");
    }
    setMarkingAllRead(false);
  };

  const handleNotificationRead = (notificationUuid: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationUuid === notificationUuid ? { ...n, isRead: true } : n
      )
    );
    onNotificationRead?.();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="p-4 text-center text-fg-muted">
        <p>알림을 불러오는 중...</p>
      </div>
    );
  }

  // Bell Popover 전용: 최근 10개만 표시
  const recentNotifications = notifications.slice(0, 10);

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-lg">알림</h3>
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

      {/* 알림 목록 */}
      <ScrollArea className="flex-1">
        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 mx-auto mb-3 flex items-center justify-center">
              <Bell className="w-8 h-8 text-brand-500 opacity-85" />
            </div>
            <p className="text-sm font-semibold text-fg">알림이 없어요</p>
            <p className="text-xs text-fg-muted mt-1">예산 80% / 100% 초과 시 알려드릴게요</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.notificationUuid}
                notification={notification}
                onRead={handleNotificationRead}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 전체보기 링크 */}
      <div className="border-t border-border px-4 py-2.5 bg-bg-muted">
        <Link
          href="/notifications"
          onClick={onLinkClick}
          className="block text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          전체 보기 →
        </Link>
      </div>
    </div>
  );
}
