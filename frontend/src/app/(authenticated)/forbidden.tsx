import { StatusCard } from "@/components/error/StatusCard";

export default function AuthenticatedForbidden() {
  return (
    <StatusCard
      kind="forbidden"
      primaryCta={{ label: "홈으로", href: "/dashboard" }}
      secondaryCta={{ label: "로그인 다시 시도", href: "/auth/signin" }}
    />
  );
}
