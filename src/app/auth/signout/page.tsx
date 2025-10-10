import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import Link from "next/link";

/**
 * 로그아웃 확인 페이지
 * 사용자가 로그아웃을 확인하고 실행
 */
export default function SignOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <LogOut className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            로그아웃
          </CardTitle>
          <CardDescription className="text-base">
            정말 로그아웃 하시겠습니까?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center">
            로그아웃하시면 저장된 세션이 삭제되며,<br />
            다시 사용하려면 로그인이 필요합니다.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
            className="w-full"
          >
            <Button type="submit" variant="destructive" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </form>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              취소
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

