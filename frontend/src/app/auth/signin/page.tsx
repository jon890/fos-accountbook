import { Users } from "lucide-react";
import { AuthCenterCard } from "@/components/auth/AuthCenterCard";
import { SignInForm } from "@/components/auth/SignInForm";
import { SessionExpiredToast } from "./_components/SessionExpiredToast";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";
  const error = params.error;
  const customMessage = params.message;

  return (
    <AuthCenterCard
      icon={Users}
      iconBg="gradient-family"
      iconColor="text-brand-fg"
      title="우리집 가계부"
      subtitle="가족과 함께 관리하는 스마트 가계부"
    >
      <SessionExpiredToast error={error === "auth" ? "auth" : undefined} />
      {(error || customMessage) && (
        <div className="bg-expense/10 border border-expense/20 text-expense px-4 py-3 rounded-md">
          <p className="text-sm font-medium">
            {customMessage || getErrorMessage(error!)}
          </p>
        </div>
      )}

      <SignInForm callbackUrl={callbackUrl} />

      <div className="text-center text-sm text-fg-muted">
        <p>로그인하시면 가족 가계부를</p>
        <p>바로 시작하실 수 있습니다.</p>
      </div>
    </AuthCenterCard>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case "network":
      return "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
    case "auth":
      return "인증이 만료되었습니다. 다시 로그인해주세요.";
    case "profile":
      return "사용자 프로필을 불러올 수 없습니다. 다시 로그인해주세요.";
    case "OAuthSignin":
      return "OAuth 제공자와 연결하는 중 오류가 발생했습니다.";
    case "OAuthCallback":
      return "OAuth 제공자로부터 응답을 처리하는 중 오류가 발생했습니다.";
    case "OAuthCreateAccount":
      return "계정을 생성하는 중 오류가 발생했습니다.";
    case "EmailCreateAccount":
      return "이메일 계정을 생성하는 중 오류가 발생했습니다.";
    case "Callback":
      return "콜백 처리 중 오류가 발생했습니다.";
    case "OAuthAccountNotLinked":
      return "이메일이 이미 다른 계정에 연결되어 있습니다.";
    case "EmailSignin":
      return "이메일을 보내는 중 오류가 발생했습니다.";
    case "CredentialsSignin":
      return "로그인에 실패했습니다. 입력한 정보를 확인해주세요.";
    case "SessionRequired":
      return "이 페이지에 접근하려면 로그인이 필요합니다.";
    default:
      return "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";
  }
}
