"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Clock, UserPlus, Loader2 } from "lucide-react";
import { acceptInvitationAction } from "@/actions/invitation/accept-invitation-action";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/client/utils";

interface InvitePageClientProps {
  token: string;
  familyName: string;
  // RSC→Client 직렬화 경계에서 string 으로 도착할 수 있어 union 으로 받는다
  expiresAt: Date | string;
}

export function InvitePageClient({
  token,
  familyName,
  expiresAt,
}: InvitePageClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const hoursUntilExpire =
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
  const isAlreadyExpired = hoursUntilExpire <= 0;
  const isExpiringSoon = !isAlreadyExpired && hoursUntilExpire <= 24;

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const result = await acceptInvitationAction(token);

      if (result.success) {
        toast.success("초대를 수락했습니다");
        // 성공 시 대시보드로 이동
        router.push("/");
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("초대 수락 중 오류가 발생했습니다");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-bg">
      <Card className="max-w-md w-full bg-bg-elev border-border shadow-default">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="w-24 h-24 gradient-family rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-brand-fg" />
          </div>
          <CardTitle className="text-2xl font-bold text-fg tracking-tight">
            가족 초대
          </CardTitle>
          <CardDescription className="text-base text-fg-muted">
            가계부를 함께 관리하도록 초대받았어요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 가족 정보 */}
          <div className="bg-bg-muted rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-brand-500" />
              <div className="flex-1">
                <p className="text-xs text-fg-muted">가족 이름</p>
                <p className="text-lg font-semibold text-fg">{familyName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock
                className={cn(
                  "w-5 h-5",
                  isExpiringSoon ? "text-expense" : "text-fg-muted",
                )}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-fg-muted">만료 일시</p>
                  {isExpiringSoon && (
                    <span className="px-1.5 py-0.5 rounded-md bg-expense/10 text-expense text-[10.5px] font-bold uppercase tracking-wide">
                      곧 만료
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    isExpiringSoon ? "text-expense" : "text-fg",
                  )}
                >
                  {format(new Date(expiresAt), "M월 d일 (E) HH:mm", {
                    locale: ko,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-brand-50 rounded-xl p-4">
            <p className="text-sm text-brand-700 leading-relaxed">
              초대를 수락하면{" "}
              <span className="font-semibold">{familyName}</span>
              {" "}의 구성원이 되어 함께 가계부를 작성하고 관리할 수 있어요.
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={isAccepting}
            >
              거절하기
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 gradient-family text-brand-fg rounded-xl shadow-default hover:opacity-90 transition-opacity"
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  수락 중...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  초대 수락하기
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
