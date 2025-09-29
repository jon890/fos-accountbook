"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  joinFamilyAction,
  type ActionResult,
} from "@/app/actions/family-invite-actions";
import { toast } from "sonner";
import { MemberStatus } from "@/types/enums";

interface JoinFamilyFormProps {
  initialInviteCode?: string;
}

export function JoinFamilyForm({ initialInviteCode }: JoinFamilyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [joinResult, setJoinResult] = useState<{
    memberStatus: MemberStatus;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result: ActionResult = await joinFamilyAction(formData);

      if (result.success) {
        setJoinResult(result.data as { memberStatus: MemberStatus });
        toast.success(result.message);
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach((error) => toast.error(error));
        }
      }
    } catch {
      toast.error("가족 가입 신청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (joinResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {joinResult.memberStatus === MemberStatus.ACTIVE
              ? "가족 가입 완료!"
              : "가입 신청 완료!"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {joinResult.memberStatus === MemberStatus.ACTIVE ? (
            <div className="text-center space-y-4">
              <p className="text-green-600">
                성공적으로 가족에 가입되었습니다!
              </p>
              <Button onClick={() => router.push("/families")}>
                가족 가계부 보기
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-blue-600">
                가입 신청이 완료되었습니다. 관리자의 승인을 기다려 주세요.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                홈으로 돌아가기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>가족 가계부 가입</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inviteCode">초대 코드</Label>
            <Input
              id="inviteCode"
              name="inviteCode"
              defaultValue={initialInviteCode}
              placeholder="초대 코드를 입력하세요"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              가족 관리자로부터 받은 초대 코드를 입력하세요
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "가입 신청 중..." : "가입 신청"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
