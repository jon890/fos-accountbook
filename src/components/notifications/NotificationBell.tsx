"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { NotificationList } from "./NotificationList";
import { getUnreadCountAction } from "@/app/actions/notification/get-unread-count-action";

interface NotificationBellProps {
  familyUuid: string;
}

export function NotificationBell({ familyUuid }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 읽지 않은 알림 수 조회
  useEffect(() => {
    if (!familyUuid) return;

    const fetchUnreadCount = async () => {
      const result = await getUnreadCountAction(familyUuid);
      if (result.success && result.data !== undefined) {
        setUnreadCount(result.data);
      }
    };

    fetchUnreadCount();

    // 1분마다 자동 갱신
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(interval);
  }, [familyUuid]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleNotificationRead = () => {
    // 알림을 읽으면 카운트 감소
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleAllRead = () => {
    // 모든 알림을 읽으면 카운트 0으로
    setUnreadCount(0);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-gray-600 hover:text-gray-900 h-8 w-8 md:h-9 md:w-9 p-0"
        >
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center text-[10px] md:text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <NotificationList
          familyUuid={familyUuid}
          onNotificationRead={handleNotificationRead}
          onAllRead={handleAllRead}
        />
      </PopoverContent>
    </Popover>
  );
}
