"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { markNotificationReadAction } from "@/app/actions/notification/mark-notification-read-action";
import type {
  Notification,
  NotificationType,
} from "@/types/actions/notification";

interface NotificationItemProps {
  notification: Notification;
  onRead?: (notificationUuid: string) => void;
}

// 알림 타입별 아이콘
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "BUDGET_50_EXCEEDED":
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "BUDGET_80_EXCEEDED":
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    case "BUDGET_100_EXCEEDED":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-blue-500" />;
  }
};

// 알림 타입별 배경색
const getNotificationBgColor = (type: NotificationType) => {
  switch (type) {
    case "BUDGET_50_EXCEEDED":
      return "bg-yellow-50 border-yellow-200";
    case "BUDGET_80_EXCEEDED":
      return "bg-orange-50 border-orange-200";
    case "BUDGET_100_EXCEEDED":
      return "bg-red-50 border-red-200";
    default:
      return "bg-blue-50 border-blue-200";
  }
};

// 시간 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
};

export function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const [isReading, setIsReading] = useState(false);

  const handleClick = async () => {
    if (notification.isRead || isReading) return;

    setIsReading(true);
    const result = await markNotificationReadAction(
      notification.notificationUuid
    );
    if (result.success) {
      onRead?.(notification.notificationUuid);
    }
    setIsReading(false);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full p-4 text-left transition-colors hover:bg-gray-50",
        !notification.isRead && "bg-blue-50/50"
      )}
    >
      <div className="flex gap-3">
        {/* 아이콘 */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border",
            getNotificationBgColor(notification.type)
          )}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                "text-sm font-semibold truncate",
                !notification.isRead && "text-gray-900",
                notification.isRead && "text-gray-600"
              )}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
            )}
          </div>
          <p
            className={cn(
              "text-xs mb-2 line-clamp-2",
              !notification.isRead && "text-gray-700",
              notification.isRead && "text-gray-500"
            )}
          >
            {notification.message}
          </p>
          <time className="text-xs text-gray-400">
            {formatDate(notification.createdAt)}
          </time>
        </div>
      </div>
    </button>
  );
}
