"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  approveMemberAction,
  rejectMemberAction,
  type ActionResult,
} from "@/app/actions/family-invite-actions";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";
import { MemberStatus, MemberRole } from "@/types/enums";

interface PendingMember {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface PendingMembersListProps {
  familyUuid: string;
  pendingMembers: PendingMember[];
}

export function PendingMembersList({
  familyUuid,
  pendingMembers,
}: PendingMembersListProps) {
  const [loadingMembers, setLoadingMembers] = useState<Set<string>>(new Set());

  const handleMemberAction = async (
    userUuid: string,
    action: "approve" | "reject"
  ) => {
    setLoadingMembers((prev) => new Set(prev).add(userUuid));

    try {
      const formData = new FormData();
      formData.set("familyUuid", familyUuid);
      formData.set("userUuid", userUuid);

      const result: ActionResult =
        action === "approve"
          ? await approveMemberAction(formData)
          : await rejectMemberAction(formData);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach((error) => toast.error(error));
        }
      }
    } catch {
      toast.error(
        `멤버 ${action === "approve" ? "승인" : "거절"} 중 오류가 발생했습니다.`
      );
    } finally {
      setLoadingMembers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userUuid);
        return newSet;
      });
    }
  };

  if (pendingMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            대기 중인 멤버
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            대기 중인 가입 신청이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          대기 중인 멤버 ({pendingMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>
                    {member.user.name?.charAt(0) ||
                      member.user.email?.charAt(0) ||
                      "?"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.user.name || member.user.email}
                    </span>
                    <Badge variant="outline">
                      {member.role === MemberRole.ADMIN ? "관리자" : "멤버"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    신청일: {member.joinedAt.toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleMemberAction(member.user.id, "approve")}
                  disabled={loadingMembers.has(member.user.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  승인
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleMemberAction(member.user.id, "reject")}
                  disabled={loadingMembers.has(member.user.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  거절
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
