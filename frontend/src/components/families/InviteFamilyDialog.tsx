/**
 * 가족 초대 다이얼로그
 */

"use client";

import { createInvitationLinkAction } from "@/actions/invitation/create-invitation-link-action";
import { deleteInvitationAction } from "@/actions/invitation/delete-invitation-action";
import { getActiveInvitationsAction } from "@/actions/invitation/get-active-invitations-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InvitationInfo } from "@/types/invitation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Check,
  Copy,
  Link as LinkIcon,
  Loader2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface InviteFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFamilyDialog({
  open,
  onOpenChange,
}: InviteFamilyDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [invitations, setInvitations] = useState<InvitationInfo[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const version = ++requestVersion.current;
    const fetchInvitations = async () => {
      try {
        const result = await getActiveInvitationsAction();
        if (version !== requestVersion.current) {
          return;
        }
        if (result.success) {
          setInvitations(result.data);
        } else {
          toast.error(result.error.message);
        }
      } catch {
        if (version === requestVersion.current) {
          toast.error("초대 목록을 불러오지 못했습니다");
        }
      }
    };

    void fetchInvitations();
    return () => {
      requestVersion.current += 1;
    };
  }, [open]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const loadInvitations = async () => {
    const version = requestVersion.current;
    try {
      const result = await getActiveInvitationsAction();
      if (version !== requestVersion.current) {
        return;
      }
      if (result.success) {
        setInvitations(result.data);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      if (version === requestVersion.current) {
        toast.error("초대 목록을 불러오지 못했습니다");
      }
    }
  };

  const handleCreateInvitation = async () => {
    const version = requestVersion.current;
    setIsCreating(true);
    try {
      const result = await createInvitationLinkAction();
      if (version !== requestVersion.current) {
        return;
      }

      if (result.success) {
        toast.success("초대 링크가 생성되었습니다");
        await loadInvitations();
        if (version !== requestVersion.current) {
          return;
        }

        // 자동으로 클립보드에 복사
        await copyToClipboard(result.data.inviteUrl, result.data.token);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      if (version === requestVersion.current) {
        toast.error("초대 링크 생성에 실패했습니다");
      }
    } finally {
      if (mounted.current) {
        setIsCreating(false);
      }
    }
  };

  const copyToClipboard = async (url: string, token: string) => {
    const version = requestVersion.current;
    try {
      await navigator.clipboard.writeText(url);
      if (version !== requestVersion.current) {
        return;
      }
      setCopiedToken(token);
      toast.success("초대 링크가 복사되었습니다!");

      // 2초 후 복사 상태 초기화
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
      copyTimeout.current = setTimeout(() => {
        setCopiedToken(null);
      }, 2000);
    } catch {
      if (version === requestVersion.current) {
        toast.error("복사에 실패했습니다");
      }
    }
  };

  const handleDeleteInvitation = async (uuid: string) => {
    const version = requestVersion.current;
    try {
      const result = await deleteInvitationAction(uuid);
      if (version !== requestVersion.current) {
        return;
      }

      if (result.success) {
        toast.success("초대가 삭제되었습니다");
        await loadInvitations();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      if (version === requestVersion.current) {
        toast.error("초대 삭제에 실패했습니다");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>가족 초대</span>
          </DialogTitle>
          <DialogDescription>
            초대 링크를 생성하여 가족 구성원을 추가하세요 (72시간 유효)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-x-hidden">
          {/* 초대 링크 생성 버튼 */}
          <Button
            onClick={handleCreateInvitation}
            disabled={isCreating}
            className="w-full gradient-primary hover:opacity-90"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-2" />새 초대 링크 생성
              </>
            )}
          </Button>

          {/* 활성 초대 목록 */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">
                활성 초대 링크
              </h4>

              {invitations.map((invitation) => (
                <div
                  key={invitation.uuid}
                  className="bg-gray-50 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        만료:{" "}
                        {format(
                          new Date(invitation.expiresAt),
                          "M월 d일 HH:mm",
                          { locale: ko }
                        )}
                      </p>
                      <div className="w-full overflow-hidden">
                        <p className="text-xs font-mono text-gray-700 truncate">
                          {invitation.inviteUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        aria-label="초대 링크 복사"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(
                            invitation.inviteUrl,
                            invitation.token
                          )
                        }
                        className="h-8 w-8 p-0"
                      >
                        {copiedToken === invitation.token ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        aria-label="초대 링크 삭제"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteInvitation(invitation.uuid)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              💡 초대 링크를 여자친구에게 공유하면 함께 가계부를 관리할 수
              있습니다!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
