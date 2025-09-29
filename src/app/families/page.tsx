import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { familyService } from "@/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Settings, Home } from "lucide-react";
import { MemberStatus, MemberRole } from "@/types/enums";
import Link from "next/link";

export default async function FamiliesPage() {
  const session = await auth();

  if (!session?.user?.uuid) {
    redirect("/api/auth/signin");
  }

  try {
    // 현재 사용자의 가족 정보 조회 (authId 사용)
    const family = await familyService.getFamilyByUserId(session.user.id);

    if (!family) {
      redirect("/families/create");
    }

    // 현재 사용자의 멤버 정보 찾기
    const currentMember = family.members.find(
      (member) => member.user.id === session.user.id
    );

    const isAdmin =
      currentMember?.role === MemberRole.ADMIN &&
      currentMember?.status === MemberStatus.ACTIVE;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">우리 가족</h1>
              <p className="text-gray-600 mt-1">
                가족 정보와 구성원을 확인하세요
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  홈으로
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/families/manage">
                  <Button size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    가족 관리
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* 가족 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {family.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      family.members.filter(
                        (m) => m.status === MemberStatus.ACTIVE
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">활성 멤버</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {family.categories.length}
                  </div>
                  <div className="text-sm text-gray-600">카테고리</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {family.expenses.length}
                  </div>
                  <div className="text-sm text-gray-600">지출 내역</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 가족 구성원 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>가족 구성원</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {family.members
                  .filter((member) => member.status === MemberStatus.ACTIVE)
                  .map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback>
                            {member.user.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            member.role === MemberRole.ADMIN
                              ? "default"
                              : "secondary"
                          }
                        >
                          {member.role === MemberRole.ADMIN ? "관리자" : "멤버"}
                        </Badge>
                        {member.user.id === session.user.id && (
                          <Badge variant="outline">나</Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* 권한 안내 */}
          {!isAdmin && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-800">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">
                    가족 관리 기능은 관리자만 이용할 수 있습니다.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Family page error:", error);
    redirect("/families/create");
  }
}
