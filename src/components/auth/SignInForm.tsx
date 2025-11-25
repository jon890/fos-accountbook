/**
 * 로그인 폼 컴포넌트
 * Google OAuth 및 Naver OAuth 로그인을 위한 폼
 */

"use client";

import { signInAction } from "@/app/actions/auth/signin/signin-action";
import { SubmitButton } from "@/components/ui/submit-button";
import { GoogleIcon } from "./GoogleIcon";
import { NaverIcon } from "./NaverIcon";

interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const iconClass = "size-5 mr-2 shrink-0";
  const baseButtonClass = "w-full h-12 text-base font-medium shadow-sm";

  const providers = [
    {
      id: "google",
      label: "Google로 로그인",
      className:
        "bg-white text-[#3C4043] border border-[#DADCE0] hover:bg-[#F8F9FA] active:bg-[#E8EAED] focus-visible:ring-[#4285F4]/30 focus-visible:ring-offset-2",
      icon: <GoogleIcon className={iconClass} />,
    },
    {
      id: "naver",
      label: "네이버로 로그인",
      className:
        "bg-[#03C75A] hover:bg-[#02B350] text-white focus-visible:ring-[#03C75A]/30 focus-visible:ring-offset-2",
      icon: <NaverIcon className={iconClass} />,
    },
  ];

  return (
    <div className="space-y-3">
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
