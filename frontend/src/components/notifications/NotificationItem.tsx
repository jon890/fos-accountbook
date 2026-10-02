"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/client/utils";
import { useAppRouter } from "@/lib/client/navigation";
import { useTimeZone } from "@/lib/client/timezone-context";
import { markNotificationReadAction } from "@/actions/notification/mark-notification-read-action";
import type {
  Notification,
  NotificationType,
} from "@/types/actions/notification";

interface NotificationItemProps {
  notification: Notification;
  onRead?: (notificationUuid: string) => void;
  onNavigate?: () => void;
}

const BUDGET_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "BUDGET_50_EXCEEDED",
  "BUDGET_80_EXCEEDED",
  "BUDGET_100_EXCEEDED",
];

const isBudgetNotification = (type: NotificationType) =>
  BUDGET_NOTIFICATION_TYPES.includes(type);

// 2단계 톤 매핑
type NotificationTone = "warning" | "expense" | "brand";

const getNotificationTone = (type: NotificationType): NotificationTone => {
  if (type === "BUDGET_100_EXCEEDED") return "expense";
  if (type === "BUDGET_50_EXCEEDED" || type === "BUDGET_80_EXCEEDED") return "warning";
  return "brand";
};

const TONE_BG: Record<NotificationTone, string> = {
  warning: "bg-warning/10",
  expense: "bg-expense/10",
  brand:   "bg-brand-50",
};

const TONE_FG: Record<NotificationTone, string> = {
  warning: "text-warning",
  expense: "text-expense",
  brand:   "text-brand-700",
};

const getNotificationIcon = (type: NotificationType) => {
  const tone = getNotificationTone(type);
  const fgClass = TONE_FG[tone];
  switch (type) {
    case "BUDGET_50_EXCEEDED":
      return <AlertTriangle className={`w-5 h-5 ${fgClass}`} />;
    case "BUDGET_80_EXCEEDED":
      return <AlertCircle className={`w-5 h-5 ${fgClass}`} />;
    case "BUDGET_100_EXCEEDED":
      return <XCircle className={`w-5 h-5 ${fgClass}`} />;
    default:
      return <AlertCircle className={`w-5 h-5 ${fgClass}`} />;
  }
};

const formatDate = (dateString: string, timezone: string) => {
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
    timeZone: timezone,
    month: "long",
    day: "numeric",
  });
};

export function NotificationItem({
  notification,
  onRead,
  onNavigate,
}: NotificationItemProps) {
  const [isReading, setIsReading] = useState(false);
  const { timezone } = useTimeZone();
  const router = useAppRouter();
  const isBusy = isReading || router.isPending;

  const handleClick = async () => {
    if (isBusy) return;

    const shouldNavigate = isBudgetNotification(notification.type);

    if (notification.isRead) {
      if (shouldNavigate) {
        router.push("/budget");
        onNavigate?.();
      }
      return;
    }

    setIsReading(true);
    try {
      const result = await markNotificationReadAction(
        notification.familyUuid,
        notification.notificationUuid,
      );
      if (result.success) {
        onRead?.(notification.notificationUuid);
        if (shouldNavigate) {
          router.push("/budget");
          onNavigate?.();
        }
      } else {
        toast.error("알림 읽음 처리에 실패했어요. 다시 시도해 주세요.");
      }
    } catch {
      toast.error("알림 읽음 처리에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsReading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isBusy}
      aria-busy={isBusy}
      className={cn(
        "w-full p-3 text-left transition-colors hover:bg-bg-muted disabled:cursor-wait disabled:opacity-60 md:p-4",
        !notification.isRead && "bg-brand-50/50"
      )}
    >
      <div className="flex gap-3">
        {/* 아이콘 */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border",
            TONE_BG[getNotificationTone(notification.type)],
            "border-transparent"
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
                !notification.isRead ? "text-fg" : "text-fg-muted"
              )}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="flex-shrink-0 w-2 h-2 bg-brand-500 rounded-full mt-1" />
            )}
          </div>
          <p
            className={cn(
              "text-xs mb-2 line-clamp-2",
              !notification.isRead ? "text-fg-muted" : "text-fg-subtle"
            )}
          >
            {notification.message}
          </p>
          <time className="text-xs text-fg-subtle">
            {formatDate(notification.createdAt, timezone)}
          </time>
        </div>
      </div>
    </button>
  );
}
