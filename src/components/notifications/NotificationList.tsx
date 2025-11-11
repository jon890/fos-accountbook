"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck, Bell } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import { getNotificationsAction } from "@/app/actions/notification/get-notifications-action";
import { markAllNotificationsReadAction } from "@/app/actions/notification/mark-all-notifications-read-action";
import type { Notification } from "@/types/actions/notification";

interface NotificationListProps {
  familyUuid: string;
  onNotificationRead?: () => void;
  onAllRead?: () => void;
}

export function NotificationList({
  familyUuid,
  onNotificationRead,
  onAllRead,
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
      // 모든 알림을 읽음 처리
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onAllRead?.();
    }
    setMarkingAllRead(false);
  };

  const handleNotificationRead = (notificationUuid: string) => {
    // 알림을 읽음 처리
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
      <div className="p-4 text-center text-gray-500">
        <p>알림을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
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
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.notificationUuid}
                notification={notification}
                onRead={handleNotificationRead}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
