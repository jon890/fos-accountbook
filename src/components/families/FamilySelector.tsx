"use client";

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/client";
import { ChevronRight, Plus, User, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Family {
  id: string;
  name: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
  _count: {
    expenses: number;
  };
}

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
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchFamilies();
    }
  }, [session]);

  const fetchFamilies = async () => {
    try {
      setLoading(true);
      const token = session?.user?.accessToken;
      if (!token) {
        setError("인증 정보가 없습니다. 다시 로그인해주세요.");
        return;
      }

      const data = await apiGet<Family[]>("/families", { token });
      setFamilies(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchFamilies}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, rgba(59, 130, 246, 0.1) 50%, rgba(99, 102, 241, 0.1) 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            가계부 시작하기
          </h1>
          <p className="text-gray-600">
            어떤 방식으로 가계부를 관리하시겠어요?
          </p>
        </div>

        <div className="space-y-4">
          {/* 기존 가족들 */}
          {families.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                기존 가족/그룹
              </h2>
              {families.map((family) => (
                <Card
                  key={family.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
                  onClick={() => onFamilySelect(family)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {family.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {family.members.length}명
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            구성원 {family.members.length}명
                          </span>
                          <span>지출 {family._count.expenses}건</span>
                          <span>카테고리 {family.categories.length}개</span>
                        </div>

                        {/* 구성원 미리보기 */}
                        <div className="flex items-center gap-2 mt-3">
                          {family.members.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 overflow-hidden"
                            >
                              {member.user.image ? (
                                <Image
                                  src={member.user.image}
                                  alt={member.user.name || ""}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                member.user.name?.charAt(0) || "U"
                              )}
                            </div>
                          ))}
                          {family.members.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{family.members.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="my-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-50 px-3 text-gray-500">또는</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 새로운 가족/그룹 생성 옵션 */}
          <div className="grid gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200 group"
              onClick={() => onCreateFamily()}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      혼자 사용하기
                    </h3>
                    <p className="text-gray-600 text-sm">
                      개인 가계부로 시작하기
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 group"
              onClick={() => onCreateFamily()}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      새 가족/그룹 만들기
                    </h3>
                    <p className="text-gray-600 text-sm">
                      가족이나 팀과 함께 관리하기
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>

          {families.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">아직 생성된 가족/그룹이 없습니다.</p>
              <p className="text-gray-400 text-sm mt-1">
                위의 옵션을 선택해서 시작해보세요!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
