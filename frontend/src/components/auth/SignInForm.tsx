"use client";

import { signInAction } from "@/actions/auth/signin/signin-action";
import { SubmitButton } from "@/components/ui/submit-button";
import { GoogleIcon } from "./GoogleIcon";
import { NaverIcon } from "./NaverIcon";

interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const iconClass = "size-5 shrink-0";
  const baseButtonClass = "w-full h-[52px] text-[14.5px] font-semibold gap-2.5";

  const providers = [
    {
      id: "google",
      label: "Google 로 시작하기",
      className: "bg-bg border border-border text-fg hover:bg-bg-muted",
      icon: <GoogleIcon className={iconClass} />,
    },
    {
      id: "naver",
      label: "네이버로 시작하기",
      // 외부 브랜드 가이드라인 (#03C75A — Naver 공식 브랜드 색, ADR-F13 OKLCH 예외)
      className: "bg-[#03C75A] text-white hover:opacity-90",
      icon: <NaverIcon className={iconClass} />,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {providers.map(({ id, label, className, icon }) => (
        <form key={id} action={signInAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <input type="hidden" name="provider" value={id} />
          <SubmitButton
            className={`${baseButtonClass} ${className}`}
            size="lg"
            pendingText="로그인 중..."
          >
            {icon}
            {label}
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
