import { StatusCard } from "@/components/error/StatusCard";

export default function AuthenticatedNotFound() {
  return (
    <StatusCard
      kind="not-found"
      primaryCta={{ label: "홈으로", href: "/calendar" }}
    />
  );
}
