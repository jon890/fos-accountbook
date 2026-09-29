import { StatusCard } from "@/components/error/StatusCard";

export default function NotFound() {
  return (
    <StatusCard
      kind="not-found"
      primaryCta={{ label: "홈으로", href: "/" }}
    />
  );
}
