import { StatusCard } from "@/components/error/StatusCard";

export default function AuthenticatedNotFound() {
  return (
    <StatusCard
      kind="not-found"
      primaryCta={{ label: "대시보드로", href: "/dashboard" }}
    />
  );
}
