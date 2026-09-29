import Link from "next/link";
import { LogOut } from "lucide-react";
import { AuthCenterCard } from "@/components/auth/AuthCenterCard";

export default function SignOutPage() {
  return (
    <AuthCenterCard
      icon={LogOut}
      iconBg="bg-brand-50"
      iconColor="text-brand-700"
      title="로그아웃됐어요"
      subtitle="다시 만날 날을 기다릴게요"
    >
      <Link
        href="/auth/signin"
        className="flex items-center justify-center gap-2 w-full h-[50px] rounded-xl bg-brand-500 text-brand-fg text-[14.5px] font-bold shadow-brand-btn"
      >
        다시 로그인
      </Link>

      <Link
        href="/"
        className="block text-center text-[12.5px] font-semibold text-fg-muted hover:text-fg transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </AuthCenterCard>
  );
}
