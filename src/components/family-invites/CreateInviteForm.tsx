"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInviteAction,
  type ActionResult,
} from "@/app/actions/family-invite-actions";
import { toast } from "sonner";

interface CreateInviteFormProps {
  familyUuid: string;
}

export function CreateInviteForm({ familyUuid }: CreateInviteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    inviteCode: string;
    expiresAt: Date;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      // familyUuid를 FormData에 추가
      formData.set("familyUuid", familyUuid);

      const result: ActionResult = await createInviteAction(formData);

      if (result.success && result.data) {
        setInviteResult(result.data as { inviteCode: string; expiresAt: Date });
        toast.success(result.message);
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach((error) => toast.error(error));
        }
      }
    } catch {
      toast.error("초대 링크 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteResult) {
      const inviteUrl = `${window.location.origin}/join/${inviteResult.inviteCode}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("초대 링크가 클립보드에 복사되었습니다.");
    }
  };

  if (inviteResult) {
    const inviteUrl = `${window.location.origin}/join/${inviteResult.inviteCode}`;
    const expiresAt = new Date(inviteResult.expiresAt);

    return (
      <Card>
        <CardHeader>
          <CardTitle>초대 링크가 생성되었습니다!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>초대 링크</Label>
            <div className="flex gap-2">
              <Input value={inviteUrl} readOnly />
              <Button onClick={copyInviteLink} variant="outline">
                복사
              </Button>
            </div>
          </div>
          <div>
            <Label>만료 시간</Label>
            <p className="text-sm text-muted-foreground">
              {expiresAt.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Button
            onClick={() => setInviteResult(null)}
            variant="outline"
            className="w-full"
          >
            새 초대 링크 만들기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>가족 초대 링크 생성</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="expiresInDays">만료 기간 (일)</Label>
            <Input
              id="expiresInDays"
              name="expiresInDays"
              type="number"
              min="1"
              max="30"
              defaultValue="7"
              placeholder="7"
            />
            <p className="text-sm text-muted-foreground mt-1">
              초대 링크가 유효할 기간을 설정하세요 (최대 30일)
            </p>
          </div>

          <div>
            <Label htmlFor="usageLimit">사용 횟수 제한 (선택사항)</Label>
            <Input
              id="usageLimit"
              name="usageLimit"
              type="number"
              min="1"
              placeholder="무제한"
            />
            <p className="text-sm text-muted-foreground mt-1">
              설정하지 않으면 무제한으로 사용 가능합니다
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "생성 중..." : "초대 링크 생성"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
