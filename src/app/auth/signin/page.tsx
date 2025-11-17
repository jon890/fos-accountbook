import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/components/auth/SignInForm";

/**
 * 로그인 페이지
 * Google OAuth를 통한 로그인
 */
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">우리집 가계부</CardTitle>
          <CardDescription>
            가족과 함께 관리하는 스마트 가계부 💰
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(error || customMessage) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">
                {customMessage || getErrorMessage(error!)}
              </p>
            </div>
          )}

          <SignInForm callbackUrl={callbackUrl} />

          <div className="text-center text-sm text-gray-500">
            <p>로그인하시면 가족 가계부를</p>
            <p>바로 시작하실 수 있습니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
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
