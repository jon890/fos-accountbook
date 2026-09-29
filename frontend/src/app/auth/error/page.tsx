import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { AuthCenterCard } from "@/components/auth/AuthCenterCard";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const subtitle = getErrorSubtitle(error);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <AuthCenterCard
      icon={AlertCircle}
      iconBg="bg-expense/10"
      iconColor="text-expense"
      title="문제가 발생했어요"
      subtitle={subtitle}
    >
      {isDev && error && (
        <div className="bg-bg-muted rounded-lg px-3 py-2">
          <p className="text-[11px] text-fg-subtle font-mono">{error}</p>
        </div>
      )}

      <Link
        href="/auth/signin"
        className="flex items-center justify-center gap-2 w-full h-[50px] rounded-xl bg-brand-500 text-brand-fg text-[14.5px] font-bold shadow-brand-btn"
      >
        다시 시도
      </Link>

      <Link
        href="/"
        className="block text-center text-[12.5px] font-semibold text-fg-muted hover:text-fg transition-colors"
      >
        홈으로
      </Link>
    </AuthCenterCard>
  );
}

function getErrorSubtitle(error?: string): string {
  switch (error) {
    case "OAuthAccountNotLinked":
      return "이미 다른 방법으로 가입된 계정이에요";
    case "OAuthSignin":
    case "Callback":
      return "로그인 중 오류가 발생했어요";
    default:
      return "잠시 후 다시 시도해주세요";
  }
}
