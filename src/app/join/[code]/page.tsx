import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { familyInviteService } from "@/container";
import { JoinFamilyForm } from "@/components/family-invites/JoinFamilyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users } from "lucide-react";

interface JoinFamilyPageProps {
  params: {
    code: string;
  };
}

export default async function JoinFamilyPage({ params }: JoinFamilyPageProps) {
  const session = await auth();

  if (!session?.user?.uuid) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              가족 가계부에 가입하려면 먼저 로그인해주세요.
            </p>
            <button
              onClick={() => (window.location.href = "/api/auth/signin")}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              로그인
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    // 초대 정보 조회
    const inviteInfo = await familyInviteService.getInviteByCode(params.code);

    if (!inviteInfo) {
      notFound();
    }

    // 초대 유효성 검사
    const validation = await familyInviteService.validateInvite(
      params.code,
      session.user.uuid
    );

    return (
      <div className="container mx-auto px-4 py-8 max-w-md space-y-6">
        {/* 초대 정보 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {inviteInfo.family.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">초대자</p>
              <p className="font-medium">
                {inviteInfo.inviter.name || inviteInfo.inviter.email}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>
                만료: {inviteInfo.expiresAt.toLocaleDateString("ko-KR")}
              </span>
            </div>

            {inviteInfo.usageLimit && (
              <div className="flex justify-between text-sm">
                <span>사용 횟수</span>
                <Badge variant="secondary">
                  {inviteInfo.usedCount} / {inviteInfo.usageLimit}
                </Badge>
              </div>
            )}

            <div>
              <Badge variant={validation.isValid ? "default" : "destructive"}>
                {validation.isValid ? "유효한 초대" : "유효하지 않은 초대"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 가입 폼 또는 오류 메시지 */}
        {validation.isValid ? (
          <JoinFamilyForm initialInviteCode={params.code} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">
                초대를 사용할 수 없습니다
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {validation.reason?.code === "expired" &&
                  "이 초대 링크는 만료되었습니다."}
                {validation.reason?.code === "inactive" &&
                  "이 초대 링크는 비활성화되었습니다."}
                {validation.reason?.code === "limit_exceeded" &&
                  "이 초대 링크의 사용 횟수가 초과되었습니다."}
                {validation.reason?.code === "already_member" &&
                  "이미 이 가족의 멤버입니다."}
                {!validation.reason && "알 수 없는 오류가 발생했습니다."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error loading invite:", error);
    notFound();
  }
}
