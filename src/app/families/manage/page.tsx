import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { familyService, familyInviteService } from "@/container";
import { CreateInviteForm } from "@/components/family-invites/CreateInviteForm";
import { PendingMembersList } from "@/components/family-invites/PendingMembersList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Link2 } from "lucide-react";
import { MemberStatus, MemberRole } from "@/types/enums";

export default async function FamilyManagePage() {
  const session = await auth();

  console.log("🔍 Debug - session:", {
    exists: !!session,
    userId: session?.user?.id,
    userUuid: session?.user?.uuid,
  });

  if (!session?.user?.uuid) {
    console.log("❌ No session or user uuid, redirecting to signin");
    redirect("/api/auth/signin");
  }

  try {
    // 현재 사용자의 가족 정보 조회 (authId 사용)
    console.log("🔍 Fetching family for user:", session.user.id);
    const family = await familyService.getFamilyByUserId(session.user.id);

    console.log("🔍 Family result:", {
      exists: !!family,
      familyName: family?.name,
      membersCount: family?.members?.length,
    });

    if (!family) {
      console.log("❌ No family found, redirecting to create");
      redirect("/families/create");
    }

    // 관리자 권한 확인
    console.log("🔍 Checking admin rights for user:", session.user.id);
    console.log(
      "🔍 Family members:",
      family.members.map((m) => ({
        userId: m.user.id,
        role: m.role,
        status: m.status,
        name: m.user.name,
      }))
    );

    const isAdmin = family.members.some((member) => {
      const userMatch = member.user.id === session.user.id;
      const roleMatch = member.role.code === MemberRole.ADMIN.code;
      const statusMatch = member.status.code === MemberStatus.ACTIVE.code;

      console.log("🔍 Member check:", {
        memberUserId: member.user.id,
        sessionUserId: session.user.id,
        userMatch,
        memberRole: member.role.code,
        expectedRole: MemberRole.ADMIN.code,
        roleMatch,
        memberStatus: member.status.code,
        expectedStatus: MemberStatus.ACTIVE.code,
        statusMatch,
        allMatch: userMatch && roleMatch && statusMatch,
      });

      return userMatch && roleMatch && statusMatch;
    });

    console.log("🔍 Admin check result:", isAdmin);

    if (!isAdmin) {
      console.log("❌ Not admin, redirecting to families");
      redirect("/families");
    }

    // 대기 중인 멤버 목록 조회
    const pendingMembers = await familyInviteService.getPendingMembers(
      family.uuid,
      session.user.uuid
    );

    // 활성 초대 링크 목록 조회
    const activeInvites = await familyInviteService.getActiveInvites(
      family.uuid,
      session.user.uuid
    );

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">가족 관리</h1>
          <p className="text-muted-foreground">
            {family.name} 가족의 멤버와 초대 링크를 관리할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 초대 링크 생성 */}
          <div className="space-y-6">
            <CreateInviteForm familyUuid={family.uuid} />

            {/* 활성 초대 링크 목록 */}
            {activeInvites && activeInvites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    활성 초대 링크 ({activeInvites.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeInvites.map((invite) => (
                      <div
                        key={invite.uuid}
                        className="p-3 border rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {invite.inviteCode}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              만료:{" "}
                              {invite.expiresAt.toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {invite.usedCount}
                            {invite.usageLimit
                              ? ` / ${invite.usageLimit}`
                              : ""}{" "}
                            사용
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 대기 중인 멤버 관리 */}
          <div className="space-y-6">
            <PendingMembersList
              familyUuid={family.uuid}
              pendingMembers={(pendingMembers || []).map((member) => ({
                ...member,
                role: MemberRole.fromCode(member.role.toString()),
                status: MemberStatus.fromCode(member.status.toString()),
              }))}
            />

            {/* 현재 멤버 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  현재 멤버 (
                  {
                    family.members.filter(
                      (m) => m.status === MemberStatus.ACTIVE
                    ).length
                  }
                  )
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {family.members
                    .filter((member) => member.status === MemberStatus.ACTIVE)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
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
                              {member.user.id === session.user.id && (
                                <Badge variant="outline">나</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              가입일:{" "}
                              {member.joinedAt.toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            member.role === MemberRole.ADMIN
                              ? "default"
                              : "secondary"
                          }
                        >
                          {member.role === MemberRole.ADMIN ? "관리자" : "멤버"}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading family management page:", error);
    redirect("/families");
  }
}
