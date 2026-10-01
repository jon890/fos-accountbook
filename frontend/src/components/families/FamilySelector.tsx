"use client";

import { getFamiliesAction } from "@/actions/family/get-families-action";
import { getUserProfileAction } from "@/actions/user/get-user-profile-action";
import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { ChevronRight, Plus, User, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FamilySelectorProps {
  onFamilySelect: (family: Family) => void;
  onCreateFamily: () => void;
}

export function FamilySelector({
  onFamilySelect,
  onCreateFamily,
}: FamilySelectorProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoSelectedRef = useRef(false);
  const { refreshSession } = useSessionRefresh();

  const handleFamilySelect = useCallback(async (family: Family) => {
    const result = await setDefaultFamilyAction(family.uuid);
    if (result.success) {
      await refreshSession();
    }
    onFamilySelect(family);
  }, [refreshSession, onFamilySelect]);

  // effect 에서 부르므로 상태는 Promise 콜백 안에서만 바꾼다. loading 의 초기값은 true 다
  const loadFamilies = useCallback(
    () =>
      getFamiliesAction()
        .then((result) => {
          if (!result.success) {
            setError(
              result.error.message || "가족 목록을 불러오는데 실패했습니다."
            );
            return;
          }

          setFamilies(result.data);
          setError(null);
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? err.message
              : "알 수 없는 오류가 발생했습니다"
          );
        })
        .finally(() => setLoading(false)),
    []
  );

  const retryLoadFamilies = () => {
    setLoading(true);
    loadFamilies();
  };

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  useEffect(() => {
    if (loading || autoSelectedRef.current || families.length === 0) return;

    const selectFamily = async () => {
      const profileResult = await getUserProfileAction();

      if (profileResult.success && profileResult.data.defaultFamilyUuid) {
        const defaultFamily = families.find(
          (f) => f.uuid === profileResult.data.defaultFamilyUuid
        );

        if (defaultFamily) {
          autoSelectedRef.current = true;
          onFamilySelect(defaultFamily);
          return;
        }
      }

      if (families.length === 1) {
        autoSelectedRef.current = true;
        await handleFamilySelect(families[0]);
      }
    };

    selectFamily();
  }, [families, loading, onFamilySelect, handleFamilySelect]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-expense mb-4">{error}</p>
            <Button onClick={retryLoadFamilies}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 app-background">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <h1 className="text-3xl font-bold text-fg flex-1">
              가계부 시작하기
            </h1>
            <div className="flex-1 flex justify-end">
              {families.length > 0 && (
                <Button
                  onClick={onCreateFamily}
                  className="gradient-primary hover:opacity-90 text-brand-fg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />새 가족 만들기
                </Button>
              )}
            </div>
          </div>
          <p className="text-fg-muted">
            {families.length > 0
              ? "기존 가족을 선택하거나 새로운 가족을 만드세요"
              : "어떤 방식으로 가계부를 관리하시겠어요?"}
          </p>
        </div>

        <div className="space-y-4">
          {/* 기존 가족들 */}
          {families.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-fg mb-4">
                기존 가족/그룹
              </h2>
              {families.map((family) => (
                <Card
                  key={family.uuid}
                  className="cursor-pointer transition border-border hover:border-brand-300 hover:shadow-default bg-bg-elev"
                  onClick={() => handleFamilySelect(family)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-fg">
                            {family.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {family.memberCount}명
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-fg-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            구성원 {family.memberCount}명
                          </span>
                          <span>지출 {family.expenseCount || 0}건</span>
                          <span>
                            카테고리 {family.categories?.length || 0}개
                          </span>
                        </div>

                      </div>

                      <ChevronRight className="w-5 h-5 text-fg-subtle" />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="my-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-bg px-3 text-fg-muted">또는</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 새로운 가족/그룹 생성 옵션 */}
          <div className="grid gap-4">
            <Card
              className="cursor-pointer hover:shadow-default transition-all duration-200 border-border hover:border-brand-300 group"
              onClick={() => onCreateFamily()}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <User className="w-7 h-7 text-brand-fg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-fg mb-1">
                      혼자 사용하기
                    </h3>
                    <p className="text-fg-muted text-sm">
                      개인 가계부로 시작하기
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-fg-subtle group-hover:text-brand-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-default transition-all duration-200 border-border hover:border-brand-300 group"
              onClick={() => onCreateFamily()}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 gradient-family rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-brand-fg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-fg mb-1">
                      새 가족/그룹 만들기
                    </h3>
                    <p className="text-fg-muted text-sm">
                      가족이나 팀과 함께 관리하기
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-fg-subtle group-hover:text-brand-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>

          {families.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-fg-subtle" />
              </div>
              <p className="text-fg-muted">아직 생성된 가족/그룹이 없습니다.</p>
              <p className="text-fg-subtle text-sm mt-1">
                위의 옵션을 선택해서 시작해보세요!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
