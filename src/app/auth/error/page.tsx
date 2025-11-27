import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

/**
 * 인증 에러 페이지
 * Auth.js에서 발생한 에러를 표시
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">
            인증 오류
          </CardTitle>
          <CardDescription className="text-base">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>오류 코드:</strong> {error || "Unknown"}
            </p>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">다음을 확인해주세요:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>인터넷 연결 상태</li>
              <li>팝업 차단 설정</li>
              <li>쿠키 및 캐시 삭제 후 재시도</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/auth/signin" className="w-full">
            <Button className="w-full" variant="default">
              다시 로그인하기
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button className="w-full" variant="outline">
              홈으로 돌아가기
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

function getErrorMessage(error?: string): string {
  switch (error) {
    case "Configuration":
      return "서버 설정에 문제가 있습니다. 관리자에게 문의해주세요.";
    case "AccessDenied":
      return "접근이 거부되었습니다. 권한을 확인해주세요.";
    case "Verification":
      return "인증 토큰이 만료되었거나 이미 사용되었습니다.";
    case "OAuthSignin":
      return "OAuth 제공자와 연결하는 중 오류가 발생했습니다.";
    case "OAuthCallback":
      return "OAuth 제공자로부터 응답을 처리하는 중 오류가 발생했습니다.";
    case "OAuthCreateAccount":
      return "계정을 생성하는 중 오류가 발생했습니다.";
    case "EmailCreateAccount":
      return "이메일 계정을 생성하는 중 오류가 발생했습니다.";
    case "Callback":
      return "로그인 콜백 처리 중 오류가 발생했습니다.";
    case "OAuthAccountNotLinked":
      return "이 이메일은 이미 다른 계정에 연결되어 있습니다. 다른 로그인 방법을 시도해주세요.";
    case "EmailSignin":
      return "이메일을 보내는 중 오류가 발생했습니다.";
    case "CredentialsSignin":
      return "로그인에 실패했습니다. 입력한 정보를 확인해주세요.";
    case "SessionRequired":
      return "이 페이지에 접근하려면 로그인이 필요합니다.";
    case "Default":
      return "로그인 중 오류가 발생했습니다.";
    default:
      return "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}
