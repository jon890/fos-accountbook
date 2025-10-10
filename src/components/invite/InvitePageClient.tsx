/**
 * 초대 페이지 Client Component
 */

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
import { acceptInvitation } from "@/app/actions/invitation-actions";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";

interface InvitePageClientProps {
  token: string;
  familyName: string;
  expiresAt: Date;
}

export function InvitePageClient({
  token,
  familyName,
  expiresAt,
}: InvitePageClientProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const result = await acceptInvitation(token);

      if (result.success) {
        toast.success(result.message);
        // 성공 시 대시보드로 이동
        router.push("/");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("초대 수락 중 오류가 발생했습니다");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push("/");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)",
      }}
    >
      <Card className="max-w-md w-full border-0 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            가족 초대
          </CardTitle>
          <CardDescription className="text-base">
            가계부를 함께 관리하도록 초대받았습니다
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 가족 정보 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-3">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">가족 이름</p>
                <p className="text-lg font-semibold text-gray-900">
                  {familyName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">만료 일시</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(expiresAt), "M월 d일 (E) HH:mm", {
                    locale: ko,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              초대를 수락하면{" "}
              <span className="font-semibold text-blue-600">{familyName}</span>의
              구성원이 되어 함께 가계부를 작성하고 관리할 수 있습니다.
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 rounded-2xl border-2"
              disabled={isAccepting}
            >
              거절하기
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl"
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
