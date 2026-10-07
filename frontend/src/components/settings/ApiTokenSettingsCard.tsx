"use client";

import { createApiTokenAction } from "@/actions/user/create-api-token-action";
import { revokeApiTokenAction } from "@/actions/user/revoke-api-token-action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/client/utils";
import type { ApiToken } from "@/types/api-token";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

const NAME_MAX_LENGTH = 50;

interface ApiTokenSettingsCardProps {
  initialTokens: ApiToken[] | null;
}

export function ApiTokenSettingsCard({
  initialTokens,
}: ApiTokenSettingsCardProps) {
  const [tokens, setTokens] = useState<ApiToken[]>(initialTokens ?? []);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  // 원문은 이 state 에만 두고 Dialog 를 닫을 때 비운다
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiToken | null>(null);

  if (initialTokens === null) {
    return (
      <p className="px-5 py-3 text-sm text-fg-muted">
        연동 토큰을 불러오지 못했어요
      </p>
    );
  }

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setName("");
      setIssuedToken(null);
    }
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("토큰 이름을 입력해주세요");
      return;
    }
    try {
      setIsCreating(true);
      const result = await createApiTokenAction(trimmed);
      if (result.success) {
        const { token, ...created } = result.data;
        setIssuedToken(token);
        setTokens((prev) => [created, ...prev]);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("연동 토큰을 발급하지 못했습니다");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      toast.success("복사했어요");
    } catch {
      toast.error("복사하지 못했어요");
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const target = revokeTarget;
    setRevokeTarget(null);
    try {
      const result = await revokeApiTokenAction(target.uuid);
      if (result.success) {
        setTokens((prev) => prev.filter((t) => t.uuid !== target.uuid));
        toast.success("토큰을 폐기했어요");
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("연동 토큰을 폐기하지 못했습니다");
    }
  };

  return (
    <div className="flex flex-col">
      {tokens.length === 0 ? (
        <p className="px-5 py-3 text-sm text-fg-muted">
          아직 발급한 토큰이 없어요
        </p>
      ) : (
        tokens.map((token, i) => (
          <div
            key={token.uuid}
            className={cn(
              "flex items-center justify-between gap-3 px-5 py-3",
              i > 0 && "border-t border-border"
            )}
          >
            <div className="min-w-0">
              <h3 className="font-medium text-fg text-sm truncate">
                {token.name}
              </h3>
              <p className="text-xs text-fg-muted mt-0.5 num">
                {token.tokenPrefix}…
              </p>
              <p className="text-xs text-fg-muted mt-0.5 num">
                발급 {format(new Date(token.createdAt), "yyyy.MM.dd", { locale: ko })} ·{" "}
                {token.lastUsedAt
                  ? `마지막 사용 ${format(new Date(token.lastUsedAt), "yyyy.MM.dd HH:mm", {
                      locale: ko,
                    })}`
                  : "사용 기록 없음"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRevokeTarget(token)}
            >
              폐기
            </Button>
          </div>
        ))
      )}

      <div className="flex justify-end px-5 pt-2 pb-1">
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-brand-fg"
        >
          토큰 발급
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {issuedToken ? "토큰을 발급했어요" : "연동 토큰 발급"}
            </DialogTitle>
          </DialogHeader>
          {issuedToken ? (
            <div className="space-y-3 pt-2">
              <code className="block break-all rounded-md bg-bg-muted p-3 text-xs text-fg num">
                {issuedToken}
              </code>
              <p className="text-xs text-fg-muted">
                이 창을 닫으면 토큰을 다시 볼 수 없어요
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  복사
                </Button>
                <Button
                  onClick={() => handleCreateOpenChange(false)}
                  className="bg-brand-500 hover:bg-brand-600 text-brand-fg"
                >
                  닫기
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="api-token-name">토큰 이름</Label>
                <Input
                  id="api-token-name"
                  value={name}
                  maxLength={NAME_MAX_LENGTH}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: fos-assistant"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCreateOpenChange(false)}
                  disabled={isCreating}
                >
                  취소
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="bg-brand-500 hover:bg-brand-600 text-brand-fg"
                >
                  {isCreating ? "발급 중..." : "발급"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {revokeTarget?.name} 토큰을 폐기할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              이 토큰을 쓰는 연동이 바로 끊겨요
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>폐기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
