import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signIn } from "@/lib/server/auth";

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

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 로그인
            </Button>
          </form>

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
